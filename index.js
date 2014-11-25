/**
 * @file index.js
 * @description datasource main
 * @author junmer(junmer@foxmail.com)
 */


var request = require('request');
var extend = require('xtend');

/**
 * DataSource
 *
 * @class
 * @constructor
 */
function DataSource() {
    this.request = request.defaults({
        headers: {
            'x-powered-by': 'rebas'
        }
    });
}

/**
 * http
 *
 * @param  {string} uri   api地址
 * @param  {Object} options  request配置
 */
DataSource.prototype.http = function(uri, options) {

    var request = this.request;

    return function (req, res, next) {

        var reqOpts = extend({
                qs: req.query,
                headers: req.headers
            },
            options
        );

        // 删除 host\referer
        // 后端有可能拒绝
        delete reqOpts.headers.host;
        delete reqOpts.headers.referer;

        var apiReq = request(
            uri,
            reqOpts,
            /**
             * api res callback
             *
             * @param  {String}   error    错误信息
             * @param  {Object}   apiRes
             * @param  {String}   body
             */
            function callback(error, apiRes, body) {

                /**
                 * 默认返回
                 *
                 * @type {Object}
                 */
                var returnData = {
                    status: -1
                };

                // 数据成功返回
                if (!error && apiRes.statusCode === 200) {

                    // 解析 JSON
                    try {
                        returnData = JSON.parse(body);
                    }
                    catch (e) {
                        returnData.statusInfo = 'api 返回数据不可解析' + e;
                    }

                }
                else {
                    returnData.status = apiRes.statusCode;
                    returnData.statusInfo = 'api 请求失败' + error;
                }

                // 去掉 一些header
                delete apiRes.headers.server;
                delete apiRes.headers['x-powered-by'];

                // 写入 res header
                res.set(apiRes.headers);

                res.data = returnData;

                next();
            }
        );

        // pipe req into apiReq
        req.pipe(apiReq);

        // todo 更科学的 输出
        // 如果直接 pipe
        // node server的下一个中间件可能就不会被执行了
        // apiReq.pipe(res);

    };

};

/**
 * 合并数据
 * @param  {Object} opts [description]
 * @return {Function}
 */
DataSource.prototype.merge = function(opts) {



    return function (req, res, next){

        // todo 合并 多个请求
        res.data = {
            aaa: {a:1},
            bbb: {b:2}
        };

        next();
    };

};


// exports factory

var datasource = new DataSource();

var modules = {};

datasource.module = function(mod) {
    return modules[mod] || (modules[mod] = new DataSource());
};

datasource.DataSource = DataSource;

module.exports = datasource;
