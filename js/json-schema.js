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

        // handle form header
        this.formHeader.on("click", "a", function() {
            $(this).parent().parent().find("a").removeClass("cur");
            $(this).addClass("cur");
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
            cb(me.root, v);
            me.hide();
        });
    };

    /**
     * Data Editor
     */

    var dataEditor = function() {

    };


    /**
     * Popup Editor
     */


    this.JsonSchema = {
        Editor: Editor,
        dataEditor: dataEditor
    };


}).call(this, jQuery);