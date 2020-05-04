window.onload = function () {
    let chunkSize = 2 * 1024 * 1024;
    var arrs = []
    var oProgress = document.getElementById('progress')
    var oBtn = document.getElementById('btn')
    var oDrag = document.getElementById("drag");
    var oUll = document.getElementById("ull");
    oDrag.addEventListener('dragenter', drag, false);
    oDrag.addEventListener('dragover', drag, false);
    oDrag.addEventListener('dragleave', drag, false);
    oDrag.addEventListener('drop', drag, false);

    function drag(e) {
        e.preventDefault();
        switch (e.type) {
            case "dragenter":
                this.innerHTML = "请释放鼠标"
                break;
            case "dragover":
                break;
            case "dragleave":
                this.innerHTML = "请将文件拖到此处"
                break;
            case "drop":
                var aFiles = e.dataTransfer.files;
                [].forEach.call(aFiles, (current, index, arr) => {
                    arrs.push(current)
                    var fileRead = new FileReader();
                    fileRead.readAsDataURL(current);
                    fileRead.addEventListener('load', function () {
                        var aLi = document.createElement('li');
                        aLi.innerHTML = '<img src="' + this.result + '"width="100%" height="100%">';
                        oUll.appendChild(aLi);
                    })
                })
                break;
        }
    }

    oBtn.addEventListener('click', function () {
        arrs.forEach(async (current) => {
            var file = current;
            const blockCount = Math.ceil(file.size / chunkSize);
            const promiseArray = [];
            const hash = await hashFile(file);
            for (var i = 0; i < blockCount; i++) {
                const start = i * chunkSize;
                const end = Math.min(file.size, start + chunkSize);

                //xhr.upload.onprogress监控上传的进度条
                var oFormData = new FormData();
                oFormData.append('data', file.slice.call(file, start, end));
                oFormData.append('name', file.name);
                oFormData.append('total', blockCount);
                oFormData.append("index", i);
                oFormData.append("size", file.size);
                oFormData.append('hash', hash);
                var xhr = new XMLHttpRequest();

                for (let i = 0; i < blockCount; i++) {
                    xhr.upload.onprogress = function (e) {
                        var scale = e.loaded / e.total;
                        oProgress.style.width = 100 * scale + "%";
                        oProgress.innerHTML = (scale * 100).toFixed(2) + '%'
                    }
                    xhr.open('post', "http://localhost:3333/upload/uploadfile", true);
                    xhr.send(oFormData)
                    var responseText = xhr.responseText;
                    console.log(responseText)
                }
                // const data = {
                //     size: file.size,
                //     name: file.name,
                //     total: blockCount,
                //     hash: hash
                // };
                // var oData = new FormData();
                // oData.append("name", file.name)
                // oData.append("size", file.size);
                // oData.append("total", blockCount);
                // oData.append("hash", hash)
                // xhr.open('post', "http://localhost:3333/upload/merge_chunks", true);
                // // xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
                // xhr.send(oData);

                // var responseText = xhr.responseText;
                // console.log(responseText)
            }
        })
    })

    function hashFile(file) {
        return new Promise((resolve, reject) => {
            const chunks = Math.ceil(file.size / chunkSize);
            let currentChunk = 0;
            const spark = new SparkMD5.ArrayBuffer;
            const fileReader = new FileReader()

            function loadNext() {
                const start = currentChunk * chunkSize;
                const end = start + chunkSize >= file.size ? file.size : start + chunkSize;
                fileReader.readAsArrayBuffer(file.slice.call(file, start, end))
            }

            fileReader.onload = e => {
                spark.append(e.target.result);
                currentChunk += 1;
                if (currentChunk < chunks) {
                    loadNext();
                } else {
                    const result = spark.end();
                    const sparkMD5 = new SparkMD5();
                    sparkMD5.append(result);
                    sparkMD5.append(file.name);

                    const hexHash = sparkMD5.end();
                    resolve(hexHash)
                }
            }

            fileReader.onerror = () => {
                console.warn("文件读取失败！")
            }

            loadNext();

        }).catch(err => {
            console.log(err)
        })
    }


}