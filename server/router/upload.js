var express = require('express');
var router = express.Router();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var fs = require('fs');
var path = require('path')

router.post('/uploadfile', multipartMiddleware, function (req, res) {

    var myfile = req.files; //文件数据
    console.log(myfile)
    var filePath = '';
    var originalFilename = '';
    if (myfile) {
        filePath = myfile.path || '';
        originalFilename = myfile.originalFilename;
    }
    if (originalFilename) {
        var newfilename = originalFilename;
        var newPath = path.join(__dirname, '../', 'image/' + newfilename);
        fs.writeFile(newPath, fs.readFileSync(filePath), function (err, result) {
            if (err) {
                return res.json({
                    code: 1,
                    message: "上传失败",
                });
            } else {
                return res.json({
                    code: 0,
                    message: "上传成功",
                });
            }
        })

    }
})
module.exports = router