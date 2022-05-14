import * as React from 'react';
import './style.css';
import * as _ from 'underscore';
import * as XLSX from 'xlsx';
import * as htmlToImage from 'html-to-image';

const BUILDING = '楼栋';
const ROOM = '房间';
const HIGHLIGHT_KEY = '楼-室';
const NONE_GOODS = ['取货码', '分拣编号', '商品总数'];
const convertToJson = (lines) => {
  var result = [];
  var headers = lines[0];
  for (var i = 1; i < lines.length; i++) {
    var obj = {};
    var currentline = lines[i];
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j];
    }
    result.push(obj);
  }
  return result;
};
const genBody = (data, tabName) => {
  if (!data) return;
  const buildingSum = tabName
    ? data[tabName]
    : data['订单商品详细'] || data['楼栋统计'];

  // const d = [...buildingSum, ...data['5-11送货单']].filter(
  //   (item) => item['用户名'] !== '总计'
  // );
  if (!buildingSum) return <div>Not data found</div>;
  const d =
    buildingSum &&
    buildingSum.map((item) => {
      for (let p in item) {
        if (!item[p]) {
          delete item[p];
        }
      }
      // item[BUILDING] = item['楼号'];
      if (!item[HIGHLIGHT_KEY]) {
        item[HIGHLIGHT_KEY] = `${item[BUILDING]}-${item[ROOM] || '0'}`;
        // item['sort'] = Number(`${item[BUILDING]}${item[ROOM] || '000'}`);
      }

      delete item['取货码'];
      // delete item['分拣编号'];
      // delete item['商品总数'];
      return item;
    });
  // .sort((a, b) => {
  //   if (a[BUILDING] == '总计') return 1;
  //   return a['sort'] > b['sort'] ? 1 : -1;
  // })
  // .map((item) => {
  //   delete item['sort'];
  //   return item;
  // });

  const colors = ['#56E8E2', '#50BF8D', '#ABFF82', 'yellow', '#56B3E8'];

  // const g = _.groupBy(d, (d) => d[HIGHLIGHT_KEY].split('-')[0]);

  const genItem = (item) => {
    const ary = [];
    _.pairs(item)
      .sort(([key]) => {
        return (
          (key === HIGHLIGHT_KEY ||
            (key.includes('楼') && key.includes('室'))) &&
          -1
        );
      })
      .map(([key, value]) => {
        // key !== BUILDING &&
        ary.push(
          <tr>
            <td
              style={{
                color:
                  key === HIGHLIGHT_KEY
                    ? 'green'
                    : _.contains(NONE_GOODS, key)
                    ? '#30220A'
                    : 'black',
              }}
            >
              {key}
            </td>
            <td
              className="value"
              style={{
                color:
                  key === HIGHLIGHT_KEY ||
                  (!_.contains(NONE_GOODS, key) && value > 1)
                    ? 'red'
                    : _.contains(NONE_GOODS, key)
                    ? 'gray'
                    : 'black',
              }}
            >
              {value}
            </td>
          </tr>
        );
      });
    return ary;
  };

  return d.map((item) => {
    return (
      <table
        style={{
          background:
            colors[Number(item[HIGHLIGHT_KEY].split('-')[0]) % colors.length],
        }}
      >
        {/* {item[BUILDING] && (
          <th>
            <td>{BUILDING}</td>
            <td>{item[BUILDING]}</td>
          </th>
        )} */}
        {genItem(item)}
      </table>
    );
  });
};
// const resDiv = React.useRef(null);
// const onButtonClick = React.useCallback(() => {
//   if (resDiv.current === null) {
//     return;
//   }
//   htmlToImage
//     .toPng(resDiv.current, { cacheBust: true })
//     .then((dataUrl) => {
//       const link = document.createElement('a');
//       link.download = 'my-image-name.png';
//       link.href = dataUrl;
//       link.click();
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// }, [resDiv]);

class ExcelToJson extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.state = {
      file: '',
      tabName: '楼栋统计',
      updateTab: false,
    };
  }

  handleClick(e) {
    this.refs.fileUploader.click();
  }

  filePathset(e) {
    e.stopPropagation();
    e.preventDefault();
    var file = e.target.files[0];
    console.log(file);
    this.setState({ file, data: null });
    var reader = new FileReader();
    reader.onload = (e) => {
      var data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const result = {};
      workbook.SheetNames.forEach((sheetName) => {
        var roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
          header: 1,
        });
        if (roa.length) result[sheetName] = convertToJson(roa);
      });
      // see the result, caution: it works after reader event is done.
      this.setState({ data: result, file });
    };
    reader.readAsArrayBuffer(file);
  }

  tabName(e) {
    e.stopPropagation();
    e.preventDefault();
    this.setState({ tabName: e.target.value, updateTab: true });
  }

  readFile() {
    if (this.state.data || !this.state.file) return;
    var oFile = this.state.file;
    var reader = new FileReader();
    reader.onload = (e) => {
      var data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      // console.log(workbook);
      var result = {};
      workbook.SheetNames.forEach((sheetName) => {
        var roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
          header: 1,
        });
        if (roa.length) result[sheetName] = convertToJson(roa);
      });
      // see the result, caution: it works after reader event is done.
      this.setState({ data: result });
    };
    reader.readAsArrayBuffer(oFile);
  }

  render() {
    return (
      <div>
        转换Excel Tab 名称:
        <input
          type="text"
          id="tabName"
          value={this.state.tabName}
          ref="tabName"
          onChange={this.tabName.bind(this)}
        />
        <input
          type="file"
          id="file"
          ref="fileUploader"
          onChange={this.filePathset.bind(this)}
        />
        {this.state.data && (
          <button
            style={{
              position: 'fixed',
            }}
            onClick={() => {
              htmlToImage
                .toSvg(this.refs.res, {
                  height: document.body.scrollHeight,
                  cacheBust: true,
                  skipAutoScale: true,
                })
                .then((dataUrl) => {
                  const link = document.createElement('a');
                  link.download =
                    this.state.file.name.replace(/\..*/gi, '') + '.svg';
                  link.href = dataUrl;
                  link.click();
                })
                .catch((err) => {
                  console.log(err);
                });
            }}
          >
            下载
          </button>
        )}
        <div ref={(ref) => (this.refs.res = ref)} className="container">
          {/* <div style={{ width: '40%', float: 'left' }}>
        {totalTable.slice(0, data.length / 2)}
      </div>
      <div style={{ width: '40%', float: 'right', marginLeft: '10%' }}>
        {totalTable.slice(data.length / 2, data.length)}
      </div> */}
          {/* {JSON.stringify(this.state.data, null, 4)} */}
          {genBody(this.state.data, this.state.tabName)}
        </div>
      </div>
    );
  }
}

export default ExcelToJson;
