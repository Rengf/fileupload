var express = require('express');
var router = express.Router();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var fs = require('fs');
var path = require('path');
const {
    resolve
} = require('path');


async function uploadFile(chunksPath, oldChunksPath, hash, index) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(chunksPath)) {
            fs.mkdirSync(chunksPath)
        }
        var readStream = fs.createReadStream(oldChunksPath);
        var writeStream = fs.createWriteStream(chunksPath + hash + '-' + index);
        readStream.pipe(writeStream);
        readStream.on('end', function (err) {
            if (err) {
                console.log(err);
                reject(err)
            } else {
                fs.unlinkSync(oldChunksPath);
                resolve("上传成功")
            }
        });
    })
}


router.post('/uploadfile', multipartMiddleware, async function (req, res) {
    var uploadPath = path.join(__dirname, '../', 'files');
    var {
        name,
        total,
        index,
        size,
        hash
    } = req.body; //文件数据

    const chunksPath = path.join(uploadPath, hash, '/');
    const oldChunksPath = req.files.data.path;

    await uploadFile(chunksPath, oldChunksPath, hash, index);
    res.json({
        status: 200,
        msg: '上传成功'
    })
})

router.post('/mergefile', async function (req, res) {
    var uploadPath = path.join(__dirname, '../', 'files');
    var {
        name,
        total,
        index,
        size,
        hash
    } = req.body; //文件数据

    const chunksPath = path.join(uploadPath, hash, '/');
    const filePath = path.join(uploadPath, name);
    const chunks = fs.readdirSync(chunksPath);
    fs.writeFileSync(filePath, '');

    if (chunks.length == total) {
        for (let i = 0; i < chunks.length; i++) {
            fs.appendFileSync(filePath, fs.readFileSync(chunksPath + hash + '-' + i));
            fs.unlinkSync(chunksPath + hash + '-' + i);
        }
        fs.rmdirSync(chunksPath);
        res.json({
            status: 200,
            msg: '成功'
        })
    }
})

module.exports = router