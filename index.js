/**
 * @file index.js
 * @description datasource main
 * @author junmer(junmer@foxmail.com)
 */


var request = require('request');
var extend = require('xtend');

/**
 * DataSource
 */
function DataSource() {
    this.request = request.defaults({
        headers: {
            'x-req-by': 'rebas'
        }
    });
}

/**
 * http
 *
 * @param  {string} uri   [description]
 * @param  {Object} options [description]
 * @return {Function}        [description]
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

        var bereq = request(
            uri,
            reqOpts,
            /**
             * [callback description]
             *
             * @param  {[type]}   error    [description]
             * @param  {[type]}   response [description]
             * @param  {[type]}   body     [description]
             * @return {Function}          [description]
             */
            function callback(error, response, body) {

                /**
                 * 默认返回
                 *
                 * @type {Object}
                 */
                var returnData = {
                    status: -1
                };

                // 数据成功返回
                if (!error && response.statusCode === 200) {

                    // 解析 JSON
                    try {
                        returnData = JSON.parse(body);
                    }
                    catch (e) {
                        returnData.statusInfo = 'api 返回数据不可解析' + e;
                    }

                }
                else {
                    returnData.status = response.statusCode;
                    returnData.statusInfo = 'api 请求失败' + error;
                }

                // todo 分析是否全覆盖headers
                delete response.headers.server;
                delete response.headers['x-powered-by'];

                // 写入 header
                res.set(response.headers);

                res.data = returnData;

                next();
            }
        );


        req.pipe(bereq);

        // todo 更科学的 输出
        // 如果直接 pipe
        // node server的下一个中间件可能就不会被执行了
        // bereq.pipe(res);

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
