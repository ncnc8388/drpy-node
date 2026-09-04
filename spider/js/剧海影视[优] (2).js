/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 0,
  title: '剧海影视',
  author: 'EylinSir',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
  类型: '影视',
  author: 'EylinSir',
  title: '剧海影视',
  host: 'http://pqysdq.gxttkeji.cn:2026',
  homeUrl: 'http://zxys.gaozhoukj.cn',
  url: '/public/?service=App.Mov.GetOnlineList&type_id=fyclass&page=fypage&limit=18',
  searchUrl: '/public/?service=App.Mov.SearchVod&key=**',
  searchable: 1,
  quickSearch: 0,
  filterable: 1,
  timeout: 10000,
  play_parse: true,
  key: '',
  iv: '1234567890123456',
  headers: {
    'User-Agent': 'okhttp/3.12.0',
    'Connection': 'Keep-Alive',
    'Accept-Encoding': 'gzip'
  },

  class_parse: async function () {
    if (!this.host) return { class: [], filters: {} };
    return {
      class: [
        { 'type_id': '1', 'type_name': '电影' },
        { 'type_id': '2', 'type_name': '连续剧' },
        { 'type_id': '3', 'type_name': '综艺' },
        { 'type_id': '4', 'type_name': '动漫' }
      ],
      filters: {}
    };
  },

  预处理: async function () {
    try {
      let respxx = await _fetch("http://192.168.1.16:5757/json/live2cms-mv.json", { headers: this.headers });
      console.log(respxx);
      console.error(respxx);
      let resp1 = await _fetch(`${this.host}/public/?service=App.Mov.GetTypeList`, { headers: this.headers });
      let text1 = await resp1.text();
      if (text1.startsWith('﻿')) text1 = text1.substring(1);
      let data1 = JSON.parse(text1);
      let sign_start = (data1.Data || []).find(i => i.type_id.toString() === '1')?.type_union || '';
      let resp2 = await _fetch(`${this.host}/public/?service=App.Mov.GetAdType`, { headers: this.headers });
      let text2 = await resp2.text();
      if (text2.startsWith('﻿')) text2 = text2.substring(1);
      let data2 = JSON.parse(text2);
      let sign_end = data2.Data.tmp || '';
      let fullKey = sign_start + sign_end;
      if (fullKey.length >= 16) {
        this.key = fullKey.substring(0, 16);
      }
    } catch (e) {
      console.error('初始化 Key 失败:', e);
      this.host = '';
    }
  },

  推荐: async function () {
    if (!this.host) return setResult([]);
    let resp = await _fetch(`${this.host}/public/?service=App.Mov.GetHomeLevel`, { headers: this.headers });
    let text = await resp.text();
    if (text.startsWith('﻿')) text = text.substring(1);
    let data = JSON.parse(text);

    let videos = typeof data === 'object' && data !== null ?
      Object.values(data)
        .filter(item => typeof item === 'object' && item !== null)
        .flatMap(item => Object.values(item))
        .filter(Array.isArray)
        .flatMap(list => list.map(k => ({
          title: k.vod_name,
          url: `${this.host}/public/?service=App.Mov.GetOnlineMvById&vodid=${k.vod_id}`,
          desc: k.vod_remarks,
          pic_url: k.vod_pic,
          vod_year: k.vod_year,
          content: k.vod_content
        })))
      : [];

    return setResult(videos);
  },

  一级: async function (tid, pg, filter, extend) {
    if (!this.host) return setResult([]);
    let url = `${this.host}/public/?service=App.Mov.GetOnlineList&type_id=${tid}&page=${pg}&limit=18`;
    let resp = await _fetch(url, { headers: this.headers });
    let text = await resp.text();
    if (text.startsWith('﻿')) text = text.substring(1);
    let data = JSON.parse(text);
    let videos = (data.Data || []).map(i => ({
      title: i.vod_name,
      url: `${this.host}/public/?service=App.Mov.GetOnlineMvById&vodid=${i.vod_id}`,
      desc: i.vod_remarks,
      pic_url: i.vod_pic,
      vod_year: i.vod_year,
      content: i.vod_content
    }));
    return setResult(videos);
  },

  二级: async function () {
    let vodId = this.input.match(/vodid=(\d+)/)[1];
    let url = `${this.host}/public/?service=App.Mov.GetOnlineMvById&vodid=${vodId}`;
    let resp = await _fetch(url, { headers: this.headers });
    let text = await resp.text();
    if (text.startsWith('﻿')) text = text.substring(1);
    let data = JSON.parse(text);
    let firstItem = (data.Data || []).find(i => typeof i === 'object' && i !== null);

    if (firstItem) {
      return {
        vod_id: firstItem.vod_id.toString(),
        vod_name: firstItem.vod_name,
        vod_pic: firstItem.vod_pic,
        vod_remarks: firstItem.vod_remarks,
        vod_year: firstItem.vod_year,
        vod_area: firstItem.vod_area,
        vod_actor: firstItem.vod_actor,
        vod_content: firstItem.vod_content,
        vod_play_from: firstItem.vod_play_from,
        vod_play_url: firstItem.vod_play_url,
        type_name: firstItem.vod_class
      };
    }

    return {};
  },

  搜索: async function () {
    if (!this.host) return setResult([]);
    let url = `${this.host}/public/?service=App.Mov.SearchVod&key=${encodeURIComponent(this.KEY)}`;
    let resp = await _fetch(url, { headers: this.headers });
    let text = await resp.text();
    if (text.startsWith('﻿')) text = text.substring(1);
    let data = JSON.parse(text);
    let videos = (data.Data || []).map(i => ({
      title: i.vod_name,
      url: `${this.host}/public/?service=App.Mov.GetOnlineMvById&vodid=${i.vod_id}`,
      desc: i.vod_remarks,
      pic_url: i.vod_pic,
      vod_year: i.vod_year,
      content: i.vod_content
    }));
    return setResult(videos);
  },

  lazy: async function () {
    let jx = 0;
    let url = '';
    let ua = 'com.gjkj.zxysdq/1.1.0 (Linux;Android 12) ExoPlayerLib/2.12.3';
    let id = this.input;
    if (id.match(/^https?:\/\/.*\.(m3u8|mp4|flv|mkv)/i)) {
      url = id;
    } else {
      try {
        let resp = await _fetch(`${this.host}/public/?service=App.Mov.GetMvJXUrlByUrl&url=${id}`, { headers: this.headers });
        let text = await resp.text();
        if (text.startsWith('﻿')) text = text.substring(1);
        let data = JSON.parse(text);
        let raw_url = data.Data.url;
        // 尝试使用CryptoJS进行AES解密
        if (this.key) {
          try {
            let key = CryptoJS.enc.Utf8.parse(this.key);
            let iv = CryptoJS.enc.Utf8.parse(this.iv);
            let decryptedUrl = CryptoJS.AES.decrypt(raw_url, key, {
              iv,
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs5
            }).toString(CryptoJS.enc.Utf8);
            url = decryptedUrl && decryptedUrl.startsWith('http') ? decryptedUrl : url;
          } catch (e) {
            console.error('AES解密失败:', e);
          }
        }
      } catch (e) {
        if (/(?:www\.iqiyi|v\.qq|v\.youku|www\.mgtv|www\.bilibili)\.com/.test(id)) {
          url = id;
          jx = 1;
          ua = MOBILE_UA;
        }
      }
    }

    return {
      parse: jx,
      url,
      header: { 'User-Agent': ua }
    };
  }
};