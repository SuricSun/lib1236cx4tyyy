(function () {

    let lib1236cx4tyyy = {

        log: function (log_str) {

            console.log("[lib1236cx4tyyy]: " + log_str);
        },

        warn: function (log_str) {

            console.warn("[lib1236cx4tyyy]: " + log_str);
        },

        error: function (log_str) {

            console.error("[lib1236cx4tyyy]: " + log_str);
        },

        wait_all: function (args) {

            return Promise.all(arguments);
        },

        math: {

            clamp: function (x, min, max) {

                return x < min ? min : (x > max ? max : x);
            },
        },

        /**
         * 当类型为duration时，如果显示了alert窗口，计时器停止运行，但是时间一直在增加，导致duration计时器运行次数减少
         * @param trigger_interval 触发回调函数的时间间隔
         * @param stop_condition_type timer停止条件，duration为到时间停止，count为触发一定次数停止
         * @param stop_condition 根据stop_condition_type不同，意义不同，如果为duration，代表时长ms，如果为count，代表出发次数
         * @param on_trigger_callback 回调函数
         * @returns Object 返回一个Promise
         */
        start_fps_timer(trigger_interval, stop_condition_type, stop_condition, on_trigger_callback) {

            if (trigger_interval < 0) {
                trigger_interval = 0;
            }

            if (stop_condition < 0) {
                stop_condition = 0;
            }

            let animation_session = {

                _request_id: undefined,
                _trigger_interval: trigger_interval,
                _stop_condition_type: stop_condition_type,
                _stop_condition: stop_condition,
                _for_what_ever_use: undefined,
                _on_trigger_callback: on_trigger_callback,
                _time_start: undefined,
                _last_time_call_func: undefined,
                _resolve: undefined,
                _reject: undefined,

                cancel: function () {

                    cancelAnimationFrame(this._request_id);
                    this._reject("cancelled");
                },

                ___run_wrapper___: function (resolve, reject) {

                    this._resolve = resolve;
                    this._reject = reject;
                    if (this._stop_condition === 0) {
                        //立即结束
                        this._on_trigger_callback.call(null, 1.0);
                        this._resolve("normal")
                        return;
                    } else {
                        switch (this._stop_condition_type) {
                            case "duration":
                                this._request_id = requestAnimationFrame(this.___run_duration___.bind(this));
                                break;
                            case "count":
                                this._request_id = requestAnimationFrame(this.___run_count___.bind(this));
                                break;
                            default:
                                throw new Error("错误的timer类型");
                                break;
                        }
                    }
                    return this;
                },

                ___run_duration___: function (ts) {

                    if (this._time_start === undefined) {
                        this._time_start = ts;
                        this._last_time_call_func = ts - this._trigger_interval - 1.0;
                        // this is for time elapsed
                        this._for_what_ever_use = 0;
                    } else {
                        this._for_what_ever_use = ts - this._time_start;
                    }
                    let should_stop = false;
                    if (ts - this._last_time_call_func >= this._trigger_interval) {
                        //判断是否是最后一次运行
                        if (this._for_what_ever_use > this._stop_condition) {
                            this._for_what_ever_use = this._stop_condition;
                            should_stop = true;
                        }
                        // 箭头函数的this总是定义的作用于的对象，不受call apply bind的影响，所以第一个参数没用，第二个参数有用
                        if (this._on_trigger_callback.call(null, this._for_what_ever_use / this._stop_condition) === false) {
                            this._resolve("early-terminate");
                            return;
                        }
                        this._last_time_call_func = ts;
                    }
                    if (should_stop === true) {
                        this._resolve("normal");
                        return;
                    }
                    this._request_id = requestAnimationFrame(this.___run_duration___.bind(this));
                },

                ___run_count___: function (ts) {

                    if (this._time_start === undefined) {
                        this._time_start = ts;
                        this._last_time_call_func = ts - this._trigger_interval - 1.0;
                        // this is for cur exec count
                        this._for_what_ever_use = 1;
                    }
                    if (ts - this._last_time_call_func >= this._trigger_interval) {
                        // 箭头函数的this总是定义的作用于的对象，不受call apply bind的影响，所以第一个参数没用，第二个参数有用
                        if (this._on_trigger_callback.call(null, this._for_what_ever_use / this._stop_condition) === false) {
                            this._resolve("early-terminate");
                            return;
                        }
                        this._for_what_ever_use++;
                        this._last_time_call_func = ts;
                    }
                    if (this._for_what_ever_use > this._stop_condition) {
                        this._resolve("normal");
                        return;
                    }
                    this._request_id = requestAnimationFrame(this.___run_count___.bind(this));
                }
            };

            let promise = new Promise((resolve, reject) => {

                animation_session.___run_wrapper___(resolve, reject);
            });

            // 只暴露方法
            let handler = {
                get: function (tgt, prop) {
                    if (prop === "cancel") {
                        return Reflect.get(animation_session, prop).bind(animation_session);
                    }
                    return Reflect.get(tgt, prop).bind(tgt);
                }
            };

            return new Proxy(promise, handler);
        },

        sel(selector) {

            if (typeof (selector) === "string") {
                return new lib1236cx4tyyy.html_elem_wrapper().set_inner_elem(document.querySelector(selector));
            } else {
                return new lib1236cx4tyyy.html_elem_wrapper().set_inner_elem(selector);
            }
        },

        html_elem_wrapper: class {

            _inner_elem = null;

            set_inner_elem(inner_elem) {

                this._inner_elem = inner_elem;
                return this;
            };

            alert() {

                alert(this._inner_elem.toString());
            };

            /**
             * * 动画的属性必须已定义，不能为缺省值，比如opacity的初始值为''，若想动画，需要手动设置一个初始值
             * <br>* 元素start_props要和end_props的单位一致，如opacity初始值为'0.5'，若指定"100%"为终止值，不会对其进行动画插值，因为单位不同
             * <br>* 如果同时调用两次animate，且两次animate的css属性有重叠，那么在两个animate方法同时执行的时间区间内，重叠的属性由最后调用的animate方法决定最终的插值
             * <br>* 考虑到效率原因，animate的html元素最好脱离标准文档流，或者animate的属性不会引起reflow（譬如opacity属性）
             * @param html_elem
             * @param start_props can be null
             * @param end_props
             * @param easing
             * @param duration 动画时长，ms
             */
            do_animate(start_props, end_props, easing, duration) {

                if (start_props == null) {
                    start_props = {};
                }
                if (end_props == null) {
                    end_props = {};
                }
                let calc_start_props = {};
                let calc_end_props = {};
                for (let prop in end_props) {
                    if (prop in this._inner_elem.style) {
                        let start_prop_to_parse = null;
                        if (prop in start_props) {
                            start_prop_to_parse = start_props[prop];
                        } else {
                            start_prop_to_parse = this._inner_elem.style[prop];
                        }
                        let parsed_start_prop = this.parse_interpolatable_css_prop(start_prop_to_parse);
                        if (parsed_start_prop !== null) {
                            let parsed_end_prop = this.parse_interpolatable_css_prop(end_props[prop]);
                            if (parsed_end_prop !== null) {
                                if (parsed_start_prop.unit_str === parsed_end_prop.unit_str) {
                                    calc_start_props[prop] = parsed_start_prop;
                                    calc_end_props[prop] = parsed_end_prop;
                                }
                            }
                        }
                    }
                }
                //default to linear
                let cubic_bezier = [
                    0, 0, 1, 1
                ];
                if (typeof (easing) === "string") {
                    switch (easing) {
                        case "linear":
                            //default to linear, we do nothing here
                            break;
                        case "ease-in":
                            cubic_bezier[0] = 0.5;
                            cubic_bezier[1] = 0;
                            break;
                        case "ease-out":
                            cubic_bezier[2] = 0.5;
                            cubic_bezier[3] = 1;
                            break;
                        case "ease-in-out":
                            cubic_bezier[0] = 0.5;
                            cubic_bezier[1] = 0;
                            cubic_bezier[2] = 0.5;
                            cubic_bezier[3] = 1;
                            break;
                        case "super-ease-in":
                            cubic_bezier[0] = 0.75;
                            cubic_bezier[1] = 0;
                            cubic_bezier[2] = 0.75;
                            cubic_bezier[3] = 0;
                            break;
                        case "super-ease-out":
                            cubic_bezier[0] = 0.25;
                            cubic_bezier[1] = 1;
                            cubic_bezier[2] = 0.25;
                            cubic_bezier[3] = 1;
                            break;
                        case "super-ease-in-out":
                            cubic_bezier[0] = 0.75;
                            cubic_bezier[1] = 0;
                            cubic_bezier[2] = 0.25;
                            cubic_bezier[3] = 1;
                            break;
                    }
                } else if (easing instanceof Array) {
                    if (easing.length === 4) {
                        cubic_bezier = easing;
                    }
                }
                //x限制于0-1
                lib1236cx4tyyy.math.clamp(cubic_bezier[0], 0, 1);
                lib1236cx4tyyy.math.clamp(cubic_bezier[2], 0, 1);
                /*
                采样32点
                采样点太少动画会有明显的卡顿感，12个采样会卡，32个看不出来
                 */
                let cubic_bezier_32_samples = [];
                for (let i = 0; i < 32; i++) {
                    let t = i / 31;
                    let x = 3.0 * cubic_bezier[0] * t * Math.pow(1.0 - t, 2.0) +
                        3.0 * cubic_bezier[2] * Math.pow(t, 2.0) * (1.0 - t) +
                        Math.pow(t, 3.0);
                    let y = 3.0 * cubic_bezier[1] * t * Math.pow(1.0 - t, 2.0) +
                        3.0 * cubic_bezier[3] * Math.pow(t, 2.0) * (1.0 - t) +
                        Math.pow(t, 3.0);
                    cubic_bezier_32_samples.push({x, y});
                }
                return lib1236cx4tyyy.start_fps_timer(
                    0,
                    "duration",
                    duration,
                    (t) => {
                        //get bezier
                        let v = -1;
                        //至少要两个采样才能正确插值
                        for (let i = 1; i < cubic_bezier_32_samples.length; i++) {
                            if (t <= cubic_bezier_32_samples[i].x) {
                                let new_t = (t - cubic_bezier_32_samples[i].x) / (cubic_bezier_32_samples[i - 1].x - cubic_bezier_32_samples[i].x);
                                v = (1.0 - new_t) * cubic_bezier_32_samples[i].y + new_t * cubic_bezier_32_samples[i - 1].y;
                                //v = lib1236cx4tyyy.clamp(v, 0, 1);
                                break;
                            }
                        }
                        if (v === -1) {
                            if (t < 0) {
                                v = 0;
                            } else if (t > 1) {
                                v = 1
                            } else {
                                v = t;
                            }
                        }
                        //计算值
                        for (let prop in calc_start_props) {
                            let real_val = (1.0 - v) * calc_start_props[prop].value + v * calc_end_props[prop].value;
                            this._inner_elem.style[prop] = real_val + calc_start_props[prop].unit_str;
                        }
                        //always returns true
                        return true;
                    });
            };

            /**
             * 如果parse成功，返回一个对象，否则返回null
             * regex is ^([+-]?(?:\d+\.)?\d+(?:e[+-]?\d+)?)(.*)?$
             * @param prop 一个字符串, "2px" "2%"
             * @returns {null|Object}
             */
            parse_interpolatable_css_prop(prop) {

                if (typeof prop === "string") {
                    //获取数字部分和(可选)单位部分
                    let arr_arr = [...prop.matchAll(/^([+-]?(?:\d+\.)?\d+(?:e[+-]?\d+)?)(.*)?$/g)];
                    if (arr_arr.length !== 1) {
                        return null;
                    }
                    let _value = parseFloat(arr_arr[0][1]);
                    if (isNaN(_value)) {
                        return null;
                    }
                    let _unit_str = "";
                    if (arr_arr[0][2] !== undefined) {
                        _unit_str = arr_arr[0][2];
                    }
                    return {
                        value: _value,
                        unit_str: _unit_str
                    };
                }
                return null;
            }
        },

        fete: {

            cached_template: new Map(),

            parse_to_cache: function (template_str_name, template_str) {

                let ret = this.parse(template_str);
                if (ret !== null) {
                    this.cached_template.set(template_str_name, ret);
                }
            },

            render: function (template_name, instantiate_data, custom_data) {

                let template = this.cached_template.get(template_name);
                if (template === undefined) {
                    return "[TEMPLATE CANNOT BE FOUND AT CACHE]";
                }

                let final_str = "";
                let out = {

                    out_data: {

                        out_str: ""
                    },

                    print: function (str) {

                        this.out_data.out_str += str;
                    },

                    render: function (template_name, instantiate_data, custom_data) {

                        this.print(lib1236cx4tyyy.fete.render(template_name, instantiate_data, custom_data));
                    },

                    reset_state: function () {

                        this.out_data.out_str = "";
                    }
                };

                template.forEach((elem) => {

                    switch (elem.type) {
                        case 0:
                            final_str += elem.str;
                            break;
                        case 1:
                            elem.js_func(out, instantiate_data, custom_data);
                            final_str += out.out_data.out_str;
                            out.reset_state();
                            break;
                        default:
                            throw new Error("不可能发生: 一个解析后的模板块的类型不为0或1");
                    }
                });

                return final_str;
            },

            parse: function (template_str) {

                let left = new RegExp("<\\[([\\d\\w$]+(?:\\.[\\d\\w$]+)?)+\\]%", "g");
                let right = new RegExp("%>", "g");

                let left_parsed = [];

                [...template_str.matchAll(left)].forEach((elem) => {
                    let index = elem.index - 1;
                    if (index >= 0) {
                        if (template_str.at(index) === "#") {
                            //被井号标注，不进行解析
                            return;
                        }
                    }
                    left_parsed.push({
                        type: 0,//for left
                        index: elem.index,
                        len: elem[0].length,
                        str: elem[0],
                        access_obj: elem[1]
                    });
                });

                let right_parsed = [];
                [...template_str.matchAll(right)].forEach((elem) => {
                    let index = elem.index - 1;
                    if (index >= 0) {
                        if (template_str.at(index) === "#") {
                            //被井号标注，不进行解析
                            return;
                        }
                    }
                    right_parsed.push({
                        type: 1,//for right
                        index: elem.index,
                        len: elem[0].length,
                        str: elem[0],
                        access_obj: elem[1]
                    });
                });

                //把两个数组由间隔排列
                //最后的index必须由小到大
                let final_arr = [];
                let left_cur = 0;
                let left_max = left_parsed.length;
                let right_cur = 0;
                let right_max = right_parsed.length;
                while (true) {
                    if (left_cur >= left_max && right_cur >= right_max) {
                        break;
                    }
                    if (left_cur < left_max && right_cur >= right_max) {
                        final_arr.push(left_parsed[left_cur]);
                        left_cur++;
                        continue;
                    }
                    if (left_cur >= left_max && right_cur < right_max) {
                        final_arr.push(right_parsed[right_cur]);
                        right_cur++;
                        continue;
                    }
                    if (left_parsed[left_cur].index < right_parsed[right_cur].index) {
                        final_arr.push(left_parsed[left_cur]);
                        left_cur++;
                    } else if (left_parsed[left_cur].index > right_parsed[right_cur].index) {
                        final_arr.push(right_parsed[right_cur]);
                        right_cur++;
                    } else {
                        throw new Error("不可能发生: 两个括号index相等");
                    }
                }

                //检查语法正确性
                let fuck_the_name = 0;
                final_arr.forEach((elem) => {

                    if (elem.type === 0) {
                        fuck_the_name++;
                    } else if (elem.type === 1) {
                        fuck_the_name--;
                    } else {
                        throw new Error("不可能发生: 一个括号的类型不为0或1");
                    }
                    if (fuck_the_name < 0 || fuck_the_name > 1) {
                        //立即得出结论
                        let len = parseInt((template_str.length * 0.2).toString());
                        __.math.clamp(len, elem.len * 2, 20)
                        throw new Error("语法错误(括号数量不匹配): " + template_str.substring(elem.index, elem.index + len));
                    }
                });
                //最后得出结论
                if (fuck_the_name !== 0) {
                    let len = parseInt((template_str.length * 0.2).toString());
                    __.math.clamp(len, final_arr[final_arr.length - 1].len * 2, 20)
                    throw new Error("语法错误(括号数量不匹配): " + template_str.substring(final_arr[final_arr.length - 1].index, final_arr[final_arr.length - 1].index + len));
                }

                //解析
                let ret_arr = [];
                let last_char_pos = 0;
                for (let i = 0; i < final_arr.length; i += 2) {
                    let start = final_arr[i].index;
                    let end = final_arr[i + 1].index + final_arr[i + 1].len;
                    if (start > last_char_pos) {
                        ret_arr.push({
                            type: 0,
                            str: template_str.substring(last_char_pos, start)
                        });
                    }
                    let _js_code = template_str.substring(final_arr[i].index + final_arr[i].len, final_arr[i + 1].index);
                    ret_arr.push({
                        type: 1,
                        str: _js_code,
                        brackets_data: final_arr[1],
                        js_func: null
                    });

                    last_char_pos = end;
                }

                if (last_char_pos < template_str.length) {
                    ret_arr.push({
                        type: 0,
                        str: template_str.substring(last_char_pos, template_str.length)
                    });
                }

                ret_arr.forEach((elem) => {

                    //把所有elem.str里面的#转义符抵消掉再生成函数
                    elem.str = elem.str.replaceAll("##", "");
                    if (elem.type === 1) {
                        elem.js_func = new Function("out", "data", "ext", elem.str);
                    }
                });

                return ret_arr;
                //解析为树
                // let Node = class {
                //
                //     parent = null;
                //     children = [];
                //     access_obj = null;
                //     out = {out: ""};
                //
                //     constructor(_parent, _access_obj) {
                //
                //         this.parent = _parent;
                //         this.access_obj = _access_obj;
                //     }
                // }
                //
                // let root_node = new Node();
                // let cur_select_node = root_node;
                // final_arr.forEach((elem) => {
                //
                //     if (elem.type === 0) {
                //         cur_select_node.children.push(new Node(cur_select_node, elem.access_obj));
                //         cur_select_node = cur_select_node.children[cur_select_node.children.length - 1];
                //     } else if (elem.type === 1) {
                //         cur_select_node = cur_select_node.parent;
                //     } else {
                //         throw new Error("不可能发生: 一个括号的类型不为0或1");
                //     }
                // });


                //根据每对括号split整个str，然后对split的数组进行
                //template_str = template_str.replaceAll("##", "");
                //然后运行所有有js代码的str数组，用js代码产生的结果替换原先的数据
                //最后拼接在一起

                // let out = {out: ""};
                // let ret = function (str) {
                //
                //     console.log("call with " + str);
                //     out.out += str;
                // }
                // for (let i = 0; i < final_arr; i += 2) {
                //     let start = final_arr[i].index;
                //     let end = final_arr[i + 1].index + final_arr[i + 1].length;
                //     let js_str = new Function(template_str.substring(start, end));
                //     js_str(ret, out, instantiate_data, custom);
                // }
            }
        }
    };
    window.lib1236cx4tyyy = lib1236cx4tyyy;
    window.__ = lib1236cx4tyyy;
})(window);