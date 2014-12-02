/**
 * @file index.js
 * @description datasource main
 * @author junmer(junmer@foxmail.com)
 */


var request = require('request');
var extend = require('xtend');

/**
 * noop
 */
function noop() {}

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
 * @param  {Object} options.header  request.header
 * @param  {Object} options.qs  request.query
 * @param  {boolean} options.pipe  request.pipe
 * @return {Function}
 */
DataSource.prototype.http = function(uri, options) {

    options = options || {};

    var request = this.request;

    return function(req, res, next) {

        // pipe 类型 不做数据处理 直接输出
        // if (res.type() === 'pipe') {
        //     options.pipe = true;
        // }

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
                // todo 配置 是否解析
                try {

                    returnData = JSON.parse(body);

                } catch (e) {

                    returnData.statusInfo = 'api 返回数据不可解析: ' + e;

                }

            }
            else {
                returnData.status = apiRes.statusCode;
                returnData.statusInfo = 'api 请求失败' + error;
            }

            // 去掉 一些header
            // todo 可配置
            delete apiRes.headers.server;
            delete apiRes.headers.etag;
            delete apiRes.headers['x-powered-by'];

            // 写入 res header
            res.set(apiRes.headers);

            res.data = returnData;

            next();
        }

        /**
         * reqOpts
         *
         * @type {Object}
         */
        var reqOpts = extend({
                qs: req.query,
                headers: req.headers
            },
            options
        );

        // 删除 host\referer
        // 后端有可能拒绝
        // todo 可配置
        delete reqOpts.headers.host;
        delete reqOpts.headers.referer;
        delete reqOpts.headers['accept-encoding'];

        // 发起请求
        var apiReq = request(uri, reqOpts, options.pipe ? noop : callback);

        // pipe req into apiReq
        req.pipe(apiReq);

        // 直接 pipe
        if (options.pipe) {
            apiReq.pipe(res);
        }

    };

};


/**
 * 合并数据
 * @param  {Object} datasourceOption
 *
 * ```
 * .merge(
 *     {
 *         user: datasource.http('user'),
 *         info: datasource.http('info')
 *     }
 * );
 *
 * ```
 * @return {Function}
 */
DataSource.prototype.merge = function(datasourceOption) {

    return function(req, res, done) {

        var sources = Object.keys(datasourceOption);
        var tasks = sources.length;

        if(!tasks) {
            done();
        }

        var ctx = this;
        var hasDone = false;
        res._data = res._data || {};

        sources.forEach(function(key) {

            datasourceOption[key].call(
                ctx, req, res,
                next.bind(null, key)
            );

        });

        /**
         * NEXT
         *
         * @param  {string}   key    key
         * @param  {Object=}   error error
         */
        function next(key, error) {

            if (hasDone) {
                return;
            }

            if (error) {
                hasDone = true;
                done(error);
                return;
            }

            res._data[key] = res.data;

            if (--tasks === 0) {
                res.data = res._data;
                done();
            }

        }

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
