<template>
  <div class="hello">
    <section class="wrap">
      <h1>图片拖拽上传</h1>
      <div class="progress">
        <div class="progress-bar">{{progress}}%</div>
      </div>
      <section class="wrap-con">
        <section
          class="area"
          @dragenter.prevent="dragenter"
          @dragover.prevent
          @dragleave="dragleave"
          @drop.prevent="drop"
        >
          <input type="file" @change="drop" />
          <article class="drag-area">{{areaTip}}</article>
        </section>
        <section class="info">
          <article>
            <button class="upload" @click="uploadFile">开始上传</button>
          </article>
        </section>
        <section class="list">
          <ul>
            <li v-for="(url,index) in filesUrl" :key="index">
              <img :src="url" :alt="index" />
            </li>
          </ul>
        </section>
      </section>
    </section>
  </div>
</template>

<script>
import axios from "axios";
import SparkMD5 from "spark-md5";
export default {
  data() {
    return {
      progress: 0,
      areaTip: "请将文件拖入此区域",
      files: {},
      filesArr: [],
      filesUrl: [],
      chunkSize: 2 * 1024 * 1024
    };
  },
  methods: {
    dragenter() {
      this.areaTip = "请释放鼠标";
    },
    dragleave() {
      this.areaTip = "请将文件拖入此区域";
    },
    drop(e) {
      this.files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
      [].forEach.call(this.files, file => {
        this.filesArr.push(file);
        var fileRead = new FileReader();
        fileRead.readAsDataURL(file);
        fileRead.onload = e => {
          this.filesUrl.push(e.target.result);
        };
      });
    },
    uploadFile() {
      this.filesArr.forEach(async file => {
        let uploadSize = 0;
        const blockCount = Math.ceil(file.size / this.chunkSize);
        const axiosPromiseArray = [];
        const hash = await this.hashFile(file);
        for (let i = 0; i < blockCount; i++) {
          const start = i * this.chunkSize;
          const end = Math.min(file.size, start + this.chunkSize);

          //xhr.upload.onprogress监控上传的进度条
          var oFormData = new FormData();
          oFormData.append("data", file.slice.call(file, start, end));
          oFormData.append("name", file.name);
          oFormData.append("total", blockCount);
          oFormData.append("index", i);
          oFormData.append("size", file.size);
          oFormData.append("hash", hash);
          const axiosOptions = {
            onUploadProgress: e => {
              // 处理上传的进度
              console.log(blockCount, i, e, file);
              uploadSize += e.loaded;
              this.progress = Math.round((uploadSize / file.size) * 100);
            }
          };

          axiosPromiseArray.push(
            axios.post(
              "http://localhost:3333/upload/uploadfile",
              oFormData,
              axiosOptions
            )
          );
        }

        await axios.all(axiosPromiseArray).then(
          axios.spread((...args) => {
            console.log(args);
            // 合并chunks
          })
        );
        const data = {
          size: file.size,
          name: file.name,
          total: blockCount,
          hash: hash
        };

        await axios
          .post("http://localhost:3333/upload/mergefile", data)
          .then(res => {
            console.log("上传成功");
            console.log(res.data, file);
            alert("上传成功");
          })
          .catch(err => {
            console.log(err);
          });
        console.log(13);
      });
    },

    hashFile(file) {
      return new Promise((resolve, reject) => {
        let that = this;
        const chunks = Math.ceil(file.size / this.chunkSize);
        let currentChunk = 0;
        const spark = new SparkMD5.ArrayBuffer();
        const fileReader = new FileReader();

        function loadNext() {
          const start = currentChunk * that.chunkSize;
          const end =
            start + that.chunkSize >= file.size
              ? file.size
              : start + that.chunkSize;
          fileReader.readAsArrayBuffer(file.slice.call(file, start, end));
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
            resolve(hexHash);
          }
        };

        fileReader.onerror = () => {
          console.warn("文件读取失败！");
        };

        loadNext();
      }).catch(err => {
        console.log(err);
      });
    }
  }
};
</script>

<style scoped lang="scss">
.wrap {
  width: 100%;
  height: 500px;
  border: 1px solid #ccc;
  h1 {
    width: 100%;
    height: 50px;
    text-align: center;
  }
  .progress {
    width: 90%;
    height: 30px;
    margin: auto;
    border: 1px solid #cbca21;
    border-radius: 5px;
    .progress-bar {
      width: 0;
      height: 30px;
      border: 1px solid #cbca21;
      border-radius: 5px;
      background-color: aqua;
    }
  }

  .wrap-con {
    padding: 5px;
    width: 90%;
    min-height: 300px;
    margin: 10px auto;
    border: 1px solid #a5cae1;

    .area {
      width: 95%;
      height: 150px;
      margin: auto;
      border: 1px solid #b45a12;
      border-radius: 5px;
      .drag-area {
        width: 100%;
        height: 100%;
      }
    }
    .list {
      ul {
        width: 95%;
        min-height: 100px;
        margin: auto;
        border: 1px solid #c4a562;
        li {
          box-sizing: border-box;
          width: 80px;
          height: 100px;
          list-style: none;
          float: left;
          margin: 5px;
          border: 1px solid #ccc;
        }
      }
    }
  }
}
</style>
