/**
 * json-schema.js
 * @author Zhang Guangda
 * 
 */

;(function($) {


    /**
     * Utils
     */
    var Class = function(SuperClass, methods) {
        var constructor = function () {};
        constructor.prototype = new SuperClass;
        constructor.prototype.constructor = constructor;
        constructor.prototype.parent = SuperClass.prototype;
        constructor.prototype = $.extend(constructor.prototype, methods);
        return constructor;
    };

    var utils = {
        template: function(str, conf) {
            return("" + str).replace(/\$(\w+)\$/g, function(a, b) {
                return typeof conf[b] != "undefined" ? conf[b] : "$" + b + "$"
            });
        },
        isEmptyObject: function(obj) {
            for (var i in obj) {
                return false;
            }
            return true;
        }
    };

    /**
     * Editor constructor
     */
    var Editor = function(options) {

        this.options = options || {};
        this.options.root = this.options.root || "body";
        // this.options.initType = this.options.initType || "object";

        if (!this._inited) this.init();
    };

    Editor.prototype.init = function() {
        if (this._inited) return;

        this.initAddBtn($(this.options.root));

        this._inited = true;
    };

    Editor.prototype.initAddBtn = function($el) {

        var me = this;
        var addNodeBtn = new EditorAddNode($el, function(btnLi, data) {
            me.addNode(btnLi, data);
        });
        $el.data("addNodeBtn", addNodeBtn.root);
    };

    Editor.prototype.addNode = function(li, data) {
        var html = utils.template(Editor.html.node, {
            color: Editor.config.color[data.type],
            icon: Editor.config.icon[data.type],
            key: data.key
        });

        var node = $(html).insertBefore(li);
        if (data.desc)
            node.find(".node-key a.node").prop("title", data.desc);

        if (data.type === "leaf") {
            node.find(".tree-ul").remove();
        } else {
            this.initAddBtn(node.find(".tree-ul"));
        }

        node.find("a.node-remove").on("click", function() {
            $(this).parent().parent().fadeOut(function() {
                $(this).remove();
            });
        });

        node.find("a.node").tooltip();

        // save data
        node.data("json", data);

        return node;
    };

    /**
     * trace the dom and get data
     */
    Editor.prototype.getData = function() {
        var output = [];

        var _traceData = function(el) {
            var data = $(el).data("json");

            if (data.type != "leaf") {
                data.struct = [];

                $(el).find(">ul.tree-ul>li.tree-node").each(function() {
                    data.struct.push(_traceData(this));
                });
            }

            return data;
        };

        $(this.options.root).find(">li.tree-node").each(function() {
            output.push(_traceData(this));
        });

        return output;

    };

    Editor.prototype.getJSON = function() {
        return JSON.stringify(this.getData());
    };

    Editor.prototype.setData = function(data) {
        if (!$.isArray(data))
            throw new Exception("Params Error, not valid input type.");

        $(this.options.root).empty();
        this._inited = false;
        this.init();

        var me = this;
        var _setNode = function(el, data) {
            var target = $(el).data("addNodeBtn");

            for (var i = 0, len = data.length; i < len; ++i) {
                var node = me.addNode(target, data[i]);

                if (data[i].struct) {
                    _setNode(node.find(">ul.tree-ul"), data[i].struct);
                }
            }
        };

        _setNode(this.options.root, data);

    };

    /**
     * get HTMLs
     */
    Editor.html = {};
    Editor.html.addNode = $.trim($("#tmpl-addNode").html());
    Editor.html.node = $.trim($("#tmpl-node").html());

    /**
     * Configuration
     */
    Editor.config = {
        color: {
            leaf: "",
            object: "btn-success",
            list: "btn-info"
        },
        icon: {
            leaf: "icon-leaf",
            object: "icon-star",
            list: "icon-th-list"
        }
    };

    /**
     * EditorAddNode
     */
    var EditorAddNode = function($el, cb) {

        this.root = $(Editor.html.addNode).appendTo($el);

        this.node = this.root.find(".add-main");
        this.btn = this.node.find("a.node-add");
        this.box = this.node.find(".add-container");
        this.form = this.node.find(".add-form");
        this.formHeader = this.node.find(".add-header");

        // show/hide box
        $(this.btn).on("click", $.proxy(this.show, this));
        // TODO needs improvement
        $(document).on("click", $.proxy(this.hide, this));
        this.node.on("click", function(e) {e.stopPropagation(); });

        var me = this;
        // handle form header
        this.formHeader.on("click", "a", function() {
            $(this).parent().parent().find("a").removeClass("cur");
            $(this).addClass("cur");

            if ($(this).data("type") == "leaf") {
                me.form.find(".input-type").show();
            } else {
                me.form.find(".input-type").hide();
            }
        });

        // set form cb
        this.setFormCb(cb || $.noop);

        $(this.btn).tooltip({trigger: "hover"});
    };

    EditorAddNode.prototype.show = function() {
        $(this.btn).addClass("hover");
        this.box.fadeIn();
    };

    EditorAddNode.prototype.hide = function() {
        $(this.btn).removeClass("hover");
        this.box.fadeOut();
    };

    EditorAddNode.prototype.setFormCb = function(cb) {
        this.form.on("reset", $.proxy(this.hide, this));
        var me = this;
        this.form.on("submit", function(e) {
            e.preventDefault();
            var v = {
                key: me.form.find('input[name="key"]').val(),
                desc: me.form.find('input[name="desc"]').val(),
                type: me.formHeader.find(".cur").data("type")
            };
            if (v.type == "leaf") {
                v.input = {
                    type: me.form.find('select').val()
                };
            }
            cb(me.root, v);
            me.hide();
        });
    };

    /**
     * Data Editor
     */

    var dataEditor = function(options) {
        this.options = options || {};
        this.options.root = this.options.root || "body";
        this.options.data = this.options.data || null;

        if (!this.options.schema &&  $.isArray(this.options.schema))
            throw new Exception('invalid schema');

        if (!this._inited) this.init();
    };

    dataEditor.prototype.init = function() {
        if (this._inited) return;

        dataEditor.html.valueText = '<input type="text" />';
        dataEditor.html.valueDatePicker = '<input type="text" class="datepicker" />';
        dataEditor.html.valueExpand = '<a href="javascript:;" class="btn ">展开 <i class="icon-chevron-down"></i> </a>';
        dataEditor.html.valueCollapse = '<a href="javascript:;" class="btn btn-warning">收起 <i class="icon-chevron-up"></i> </a>';
        dataEditor.html.valueUpload = '<a href="#upload-image" role="button" class="btn btn-primary" data-toggle="modal">Upload</a><input type="hidden" />';

        dataEditor.html.box = $.trim($("#tmpl-box").html());
        dataEditor.html.tableItem = $.trim($("#tmpl-table-item").html());
        dataEditor.html.extend = $.trim($("#tmpl-extend").html());

        this.appendBox(this.options.root, this.options.schema);

        this.setData(this.options.data);

        this._inited = true;
    };

    dataEditor.prototype.appendBox = function(el, schema, isList) {

        var box = $(dataEditor.html.box).appendTo(el);
        var table = box.find(".js-table");

        if (isList) box.find(".js-box-head").show();

        for (var i = 0, len = schema.length; i < len; ++i) {
            var itemHtml = utils.template(dataEditor.html.tableItem, {
                node_type_class: Editor.config.icon[schema[i].type],
                node_name: schema[i].key,
                color: Editor.config.color[schema[i].type]
            });
            var tableItem = $(itemHtml).appendTo(table);
            tableItem.find(".js-table-key a").prop("title", schema[i].desc).tooltip();

            var saveData = {
                key: schema[i].key,
                type: schema[i].type
            };
            if (schema[i].input) saveData.input = schema[i].input;

            tableItem.data("item", saveData);

            var tableValue = tableItem.find(".js-table-value");
            this.appendTableValue(tableValue, schema[i]);

            if (schema[i].type != "leaf") {
                this.appendExtend(box, schema[i], tableItem);
            }
        }

    };

    dataEditor.prototype.appendTableValue = function(el, node) {
        var valueHtml;
        if (node.type != "leaf") {
            valueHtml = dataEditor.html.valueExpand;

            $(el).append(valueHtml);

        } else {
            var inputType = "text";
            if (node.input) inputType = node.input.type;

            switch (inputType) {
                case "text":
                valueHtml = dataEditor.html.valueText;
                break;
                case "time":
                valueHtml = dataEditor.html.valueDatePicker;
                break;
                case "image":
                valueHtml = dataEditor.html.valueUpload;
                break;
            }

            var v = $(valueHtml).appendTo(el);

            if (inputType === "time") v.pikaday({format: "YYYY-MM-DD"});
        }
    };

    dataEditor.prototype.appendExtend = function(el, node, item) {
        var extendHtml = utils.template(dataEditor.html.extend, {
            node_type_class: Editor.config.icon[node.type],
            node_name: node.key,
            color: Editor.config.color[node.type]
        });

        var extend = $(extendHtml).appendTo(el);
        var isList = (node.type === "list");
        this.appendBox(extend.find(">.js-list-body"), node.struct, isList);

        if (isList) {
            var me = this;
            extend.find(">.js-list-head .js-list-add").show().on("click", function() {
                me.appendBox(extend.find(">.js-list-body"), node.struct, true);
                extend.find(">.js-list-body").sortable("destroy");
                extend.find(">.js-list-body").sortable({
                    handle: '.js-box-head'
                });
            });
            extend.find(">.js-list-body").sortable({
                handle: '.js-box-head'
            });
        }

        if (item) {
            this._bindExpandEvent(item, extend);
        }

    };

    dataEditor.prototype._bindExpandEvent = function(item, extend) {
        $(item).data("extend", extend);
        var btn = $(item).find(".js-table-value a");
        $(btn).on("click", function() {
            if (extend.is(":visible")) {
                $(this).removeClass("btn-warning").html('展开 <i class="icon-chevron-down"></i>');
                extend.slideUp();
            } else {
                extend.slideDown();
                $(this).addClass("btn-warning").html('收起 <i class="icon-chevron-up"></i>');
            }
        });
    };

    dataEditor.prototype.setData = function(jsonData) {
        if (!jsonData || utils.isEmptyObject(jsonData)) return;

        var _setBoxData = function(box, data) {
            $(box).find(">.js-data .js-table-item").each(function(index) {
                var itemData = $(this).data("item");

                switch (itemData.type) {
                    case "leaf":
                    $(this).find("input").val(data[itemData.key]);
                    break;
                    case "object":
                    _setBoxData($(this).data("extend").find(">.js-list-body>.js-box"), data[itemData.key]);
                    break;
                    case "list":
                    var listBody = $(this).data("extend").find(">.js-list-body");
                    listBody.empty();

                    for (var i = 0, len = data[itemData.key].length; i < len; ++i) {
                        listBody.parent().find(">.js-list-head .js-list-add").click();    
                    }

                    listBody.sortable("destroy");
                    listBody.sortable({
                        handle: '.js-box-head'
                    });

                    listBody.find(">.js-box").each(function(index) {
                        _setBoxData(this, data[itemData.key][index]);
                    });
                    break;
                }
            });
        };

        return _setBoxData($(this.options.root).find(">.js-box"), jsonData);
    };

    dataEditor.prototype.getData = function() {

        var _getBoxData = function(box) {

            var obj = {};

            $(box).find(">.js-data .js-table-item").each(function(index) {

                var itemData = $(this).data("item");
                switch (itemData.type) {
                    case "leaf":
                    obj[itemData.key] = $(this).find("input").val();
                    break;
                    case "object":
                    obj[itemData.key] = _getBoxData($(this).data("extend").find(">.js-list-body>.js-box"));
                    break;
                    case "list":
                    var ar = [];
                    $(this).data("extend").find(">.js-list-body>.js-box").each(function() {
                        ar.push(_getBoxData(this));
                    });
                    obj[itemData.key] = ar;
                    break;
                }
            });

            return obj;

        };

        return _getBoxData($(this.options.root).find(">.js-box"));
    };

    dataEditor.prototype.getJSON = function() {
        return  JSON.stringify(this.getData());
    };

    dataEditor.html = {};

    /**
     * Popup Editor
     */


    this.JsonSchema = {
        Editor: Editor,
        dataEditor: dataEditor
    };


}).call(this, jQuery);