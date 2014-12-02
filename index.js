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
 * defaultOptions
 *
 * @type {Object}
 */
DataSource.defaultOptions = {
    http: {
        ignoreRequestHeaders: ['host', 'referer', 'accept-encoding'],
        ignoreResponseHeaders: ['server', 'etag', 'x-powered-by']
    }
};


/**
 * http
 *
 * @param  {string}     uri             api地址
 * @param  {Object}     options         request配置
 * @param  {Object}     options.headers request.headers
 * @param  {Object}     options.qs      request.query
 * @param  {boolean}    options.pipe    request.pipe
 *
 * @return {Function}
 */
DataSource.prototype.http = function(uri, options) {

    options = options || {};

    var request = this.request;

    var defaultOptions = DataSource.defaultOptions.http;

    return function(req, res, next) {

        // pipe 类型 不做数据处理 直接输出
        if (res.ctype === 'pipe') {
            options.pipe = true;
        }

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
            var ejson = {
                status: -1
            };

            // 数据成功返回
            if (!error && apiRes.statusCode === 200) {

                // 解析 JSON
                // todo 配置 是否解析
                try {

                    ejson = JSON.parse(body);

                }
                catch (e) {

                    ejson.statusInfo = 'api 返回数据不可解析: ' + e;

                }

            }
            else {
                ejson.status = apiRes.statusCode;
                ejson.statusInfo = 'api 请求失败' + error;
            }

            res.data = ejson;

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
        defaultOptions.ignoreRequestHeaders.forEach(function(key) {
            delete reqOpts.headers[key];
        });

        // 发起请求
        var apiReq = request(uri, reqOpts, options.pipe ? noop : callback);

        // pipe req into apiReq
        req.pipe(apiReq);

        // rewrite res header
        apiReq.on('response', function(apiRes) {

            // 去掉 一些header
            defaultOptions.ignoreResponseHeaders.forEach(function(key) {
                delete apiRes.headers[key];
            });

            // 写入 res header
            res.set(apiRes.headers);

        });

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
