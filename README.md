# JSON Schema

## 配置结构
```javascript
{
    key: "key",
    type: "list/object/leaf",
    struct: [node1, node2, node3], // object
    struct: list, // list
    data: { // leaf
        type: "string/integer",
        // range: "",
        // is_null: true/false,
        // input_type: "text/photo/timestamp/select",
        // select: {
        //  key1: value1,
        //  key2: value2
        // }
    },
    desc: "描述"
}
```

```javascript
[{
    key: "title"
    type: "leaf",
    desc: "标题",
    data: {
        type: "integer",
        // is_null: false,
        // input_type: "text"
    }
}, {
    key: "content",
    type: "object",
    desc: "内容",
    struct: [{
        key: "text",
        type: "leaf",
        desc: "内容文案",
        data: {
            type: "string",
            // is_null: false,
            // input_type: "text"
        }
    }, {
        key: "image",
        type: "leaf",
        desc: "内容图片",
        data: {
            type: "string",
            // is_null: true,
            // input_type: "photo"
        }
    }, {
        key: "timestamp",
        type: "leaf",
        desc: "内容时间",
        data: {
            type: "string",
            // is_null: false,
            // input_type: "timestamp"
        }
    }]
}, {
    key: "comments",
    type: "list",
    desc: "评论",
    struct: [{
        key: "text",
        type: "leaf",
        desc: "评论文案",
        data: {
            type: "string",
            // is_null: false,
            // input_type: "text"
        }
    }, {
        key: "type",
        type: "leaf",
        desc: "评论类型",
        data: {
            type: "integer",
            // is_null: false,
            // input_type: "select",
            // select: {
                // 1: "type 1",
                // 2: "type 2",
                // 3: "type 3"
            // }
        }
    }, {
        key: "star",
        type: "leaf",
        desc: "评论打分",
        data: {
            type: "integer",
            // is_null: false,
            // input_type: "text",
            // range: "1-10"
        }
    }]
}]

```

```
Leaf: hello[string|text]

Object: content
    Leaf: text[string|text]
    Leaf: image[string|photo]
    Leaf: timestamp[integer|timestamp]
    +

List: comments
    Leaf: text[string|text]
    Leaf: type[integer|select]
    Leaf: star[integer|select]
    +

+
```

## 填写数据
```javascript
{
    title: "hello",
    content: {
        text: "body",
        image: "http://someimage",
        timestamp: 1372034367998
    },
    comments: [{
        text: "hi",
        type: 2,
        star: 3
    }, {
        text: "come",
        type: 1,
        star: 4
    }, {
        text: "empt",
        type: 1,
        star: 1
    }]
}
```



## 通用图片上传组件
