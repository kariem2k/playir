function utf8_encode (argString) {
  // http://kevin.vanzonneveld.net
  // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   improved by: sowberry
  // +    tweaked by: Jack
  // +   bugfixed by: Onno Marsman
  // +   improved by: Yves Sucaet
  // +   bugfixed by: Onno Marsman
  // +   bugfixed by: Ulrich
  // +   bugfixed by: Rafal Kukawski
  // +   improved by: kirilloid
  // +   bugfixed by: kirilloid
  // *     example 1: utf8_encode('Kevin van Zonneveld');
  // *     returns 1: 'Kevin van Zonneveld'

  if (argString === null || typeof argString === "undefined") {
    return "";
  }

  var string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  var utftext = '',
    start, end, stringl = 0;

  start = end = 0;
  stringl = string.length;
  for (var n = 0; n < stringl; n++) {
    var c1 = string.charCodeAt(n);
    var enc = null;

    if (c1 < 128) {
      end++;
    } else if (c1 > 127 && c1 < 2048) {
      enc = String.fromCharCode(
         (c1 >> 6)        | 192,
        ( c1        & 63) | 128
      );
    } else if (c1 & 0xF800 != 0xD800) {
      enc = String.fromCharCode(
         (c1 >> 12)       | 224,
        ((c1 >> 6)  & 63) | 128,
        ( c1        & 63) | 128
      );
    } else { // surrogate pairs
      if (c1 & 0xFC00 != 0xD800) { throw new RangeError("Unmatched trail surrogate at " + n); }
      var c2 = string.charCodeAt(++n);
      if (c2 & 0xFC00 != 0xDC00) { throw new RangeError("Unmatched lead surrogate at " + (n-1)); }
      c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
      enc = String.fromCharCode(
         (c1 >> 18)       | 240,
        ((c1 >> 12) & 63) | 128,
        ((c1 >> 6)  & 63) | 128,
        ( c1        & 63) | 128
      );
    }
    if (enc !== null) {
      if (end > start) {
        utftext += string.slice(start, end);
      }
      utftext += enc;
      start = end = n + 1;
    }
  }

  if (end > start) {
    utftext += string.slice(start, stringl);
  }

  return utftext;
}


function md5 (str) {
  // http://kevin.vanzonneveld.net
  // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
  // + namespaced by: Michael White (http://getsprink.com)
  // +    tweaked by: Jack
  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +      input by: Brett Zamir (http://brett-zamir.me)
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // -    depends on: utf8_encode
  // *     example 1: md5('Kevin van Zonneveld');
  // *     returns 1: '6e658d4bfcb59cc13f96c14450ac40b9'
  var xl;

  var rotateLeft = function (lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  };

  var addUnsigned = function (lX, lY) {
    var lX4, lY4, lX8, lY8, lResult;
    lX8 = (lX & 0x80000000);
    lY8 = (lY & 0x80000000);
    lX4 = (lX & 0x40000000);
    lY4 = (lY & 0x40000000);
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) {
      return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
      } else {
        return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
      }
    } else {
      return (lResult ^ lX8 ^ lY8);
    }
  };

  var _F = function (x, y, z) {
    return (x & y) | ((~x) & z);
  };
  var _G = function (x, y, z) {
    return (x & z) | (y & (~z));
  };
  var _H = function (x, y, z) {
    return (x ^ y ^ z);
  };
  var _I = function (x, y, z) {
    return (y ^ (x | (~z)));
  };

  var _FF = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var _GG = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var _HH = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var _II = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var convertToWordArray = function (str) {
    var lWordCount;
    var lMessageLength = str.length;
    var lNumberOfWords_temp1 = lMessageLength + 8;
    var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    var lWordArray = new Array(lNumberOfWords - 1);
    var lBytePosition = 0;
    var lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  };

  var wordToHex = function (lValue) {
    var wordToHexValue = "",
      wordToHexValue_temp = "",
      lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValue_temp = "0" + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
    }
    return wordToHexValue;
  };

  var x = [],
    k, AA, BB, CC, DD, a, b, c, d, S11 = 7,
    S12 = 12,
    S13 = 17,
    S14 = 22,
    S21 = 5,
    S22 = 9,
    S23 = 14,
    S24 = 20,
    S31 = 4,
    S32 = 11,
    S33 = 16,
    S34 = 23,
    S41 = 6,
    S42 = 10,
    S43 = 15,
    S44 = 21;

  str = this.utf8_encode(str);
  x = convertToWordArray(str);
  a = 0x67452301;
  b = 0xEFCDAB89;
  c = 0x98BADCFE;
  d = 0x10325476;

  xl = x.length;
  for (k = 0; k < xl; k += 16) {
    AA = a;
    BB = b;
    CC = c;
    DD = d;
    a = _FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
    d = _FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
    c = _FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
    b = _FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = _FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
    d = _FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
    c = _FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
    b = _FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = _FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
    d = _FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
    c = _FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
    b = _FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = _FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
    d = _FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
    c = _FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
    b = _FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
    a = _GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
    d = _GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
    c = _GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
    b = _GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
    a = _GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
    d = _GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = _GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
    b = _GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = _GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
    d = _GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
    c = _GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
    b = _GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = _GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
    d = _GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
    c = _GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
    b = _GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
    a = _HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
    d = _HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
    c = _HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
    b = _HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = _HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
    d = _HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
    c = _HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
    b = _HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = _HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
    d = _HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
    c = _HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
    b = _HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
    a = _HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
    d = _HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
    c = _HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
    b = _HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
    a = _II(a, b, c, d, x[k + 0], S41, 0xF4292244);
    d = _II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
    c = _II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
    b = _II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = _II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
    d = _II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
    c = _II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
    b = _II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = _II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
    d = _II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
    c = _II(c, d, a, b, x[k + 6], S43, 0xA3014314);
    b = _II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = _II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
    d = _II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
    c = _II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
    b = _II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);

  return temp.toLowerCase();
}


function md5Async(data, callback)
{
    if( window.md5AsyncWorking )
    {
        if( !window.md5AsyncQueue )
        {
            window.md5AsyncQueue = [];
        }
        window.md5AsyncQueue.push( {data:data, callback:callback} );
    }
    else
    {
        var windowURL = window.URL || window.webkitURL;
        if( window.Worker && windowURL && windowURL.createObjectURL )
        {
            if( !window.workerMD5Async )
            {
                var blob = new Blob([
"function utf8_encode(e){if(e===null||typeof e===\"undefined\"){return\"\"}var t=e+\"\";var n=\"\",r,i,s=0;r=i=0;s=t.length;for(var o=0;o<s;o++){var u=t.charCodeAt(o);var a=null;if(u<128){i++}else if(u>127&&u<2048){a=String.fromCharCode(u>>6|192,u&63|128)}else if(u&63488!=55296){a=String.fromCharCode(u>>12|224,u>>6&63|128,u&63|128)}else{if(u&64512!=55296){throw new RangeError(\"Unmatched trail surrogate at \"+o)}var f=t.charCodeAt(++o);if(f&64512!=56320){throw new RangeError(\"Unmatched lead surrogate at \"+(o-1))}u=((u&1023)<<10)+(f&1023)+65536;a=String.fromCharCode(u>>18|240,u>>12&63|128,u>>6&63|128,u&63|128)}if(a!==null){if(i>r){n+=t.slice(r,i)}n+=a;r=i=o+1}}if(i>r){n+=t.slice(r,s)}return n}function md5(e){var t;var n=function(e,t){return e<<t|e>>>32-t};var r=function(e,t){var n,r,i,s,o;i=e&2147483648;s=t&2147483648;n=e&1073741824;r=t&1073741824;o=(e&1073741823)+(t&1073741823);if(n&r){return o^2147483648^i^s}if(n|r){if(o&1073741824){return o^3221225472^i^s}else{return o^1073741824^i^s}}else{return o^i^s}};var i=function(e,t,n){return e&t|~e&n};var s=function(e,t,n){return e&n|t&~n};var o=function(e,t,n){return e^t^n};var u=function(e,t,n){return t^(e|~n)};var a=function(e,t,s,o,u,a,f){e=r(e,r(r(i(t,s,o),u),f));return r(n(e,a),t)};var f=function(e,t,i,o,u,a,f){e=r(e,r(r(s(t,i,o),u),f));return r(n(e,a),t)};var l=function(e,t,i,s,u,a,f){e=r(e,r(r(o(t,i,s),u),f));return r(n(e,a),t)};var c=function(e,t,i,s,o,a,f){e=r(e,r(r(u(t,i,s),o),f));return r(n(e,a),t)};var h=function(e){var t;var n=e.length;var r=n+8;var i=(r-r%64)/64;var s=(i+1)*16;var o=new Array(s-1);var u=0;var a=0;while(a<n){t=(a-a%4)/4;u=a%4*8;o[t]=o[t]|e.charCodeAt(a)<<u;a++}t=(a-a%4)/4;u=a%4*8;o[t]=o[t]|128<<u;o[s-2]=n<<3;o[s-1]=n>>>29;return o};var p=function(e){var t=\"\",n=\"\",r,i;for(i=0;i<=3;i++){r=e>>>i*8&255;n=\"0\"+r.toString(16);t=t+n.substr(n.length-2,2)}return t};var d=[],v,m,g,y,b,w,E,S,x,T=7,N=12,C=17,k=22,L=5,A=9,O=14,M=20,_=4,D=11,P=16,H=23,B=6,j=10,F=15,I=21;e=this.utf8_encode(e);d=h(e);w=1732584193;E=4023233417;S=2562383102;x=271733878;t=d.length;for(v=0;v<t;v+=16){m=w;g=E;y=S;b=x;w=a(w,E,S,x,d[v+0],T,3614090360);x=a(x,w,E,S,d[v+1],N,3905402710);S=a(S,x,w,E,d[v+2],C,606105819);E=a(E,S,x,w,d[v+3],k,3250441966);w=a(w,E,S,x,d[v+4],T,4118548399);x=a(x,w,E,S,d[v+5],N,1200080426);S=a(S,x,w,E,d[v+6],C,2821735955);E=a(E,S,x,w,d[v+7],k,4249261313);w=a(w,E,S,x,d[v+8],T,1770035416);x=a(x,w,E,S,d[v+9],N,2336552879);S=a(S,x,w,E,d[v+10],C,4294925233);E=a(E,S,x,w,d[v+11],k,2304563134);w=a(w,E,S,x,d[v+12],T,1804603682);x=a(x,w,E,S,d[v+13],N,4254626195);S=a(S,x,w,E,d[v+14],C,2792965006);E=a(E,S,x,w,d[v+15],k,1236535329);w=f(w,E,S,x,d[v+1],L,4129170786);x=f(x,w,E,S,d[v+6],A,3225465664);S=f(S,x,w,E,d[v+11],O,643717713);E=f(E,S,x,w,d[v+0],M,3921069994);w=f(w,E,S,x,d[v+5],L,3593408605);x=f(x,w,E,S,d[v+10],A,38016083);S=f(S,x,w,E,d[v+15],O,3634488961);E=f(E,S,x,w,d[v+4],M,3889429448);w=f(w,E,S,x,d[v+9],L,568446438);x=f(x,w,E,S,d[v+14],A,3275163606);S=f(S,x,w,E,d[v+3],O,4107603335);E=f(E,S,x,w,d[v+8],M,1163531501);w=f(w,E,S,x,d[v+13],L,2850285829);x=f(x,w,E,S,d[v+2],A,4243563512);S=f(S,x,w,E,d[v+7],O,1735328473);E=f(E,S,x,w,d[v+12],M,2368359562);w=l(w,E,S,x,d[v+5],_,4294588738);x=l(x,w,E,S,d[v+8],D,2272392833);S=l(S,x,w,E,d[v+11],P,1839030562);E=l(E,S,x,w,d[v+14],H,4259657740);w=l(w,E,S,x,d[v+1],_,2763975236);x=l(x,w,E,S,d[v+4],D,1272893353);S=l(S,x,w,E,d[v+7],P,4139469664);E=l(E,S,x,w,d[v+10],H,3200236656);w=l(w,E,S,x,d[v+13],_,681279174);x=l(x,w,E,S,d[v+0],D,3936430074);S=l(S,x,w,E,d[v+3],P,3572445317);E=l(E,S,x,w,d[v+6],H,76029189);w=l(w,E,S,x,d[v+9],_,3654602809);x=l(x,w,E,S,d[v+12],D,3873151461);S=l(S,x,w,E,d[v+15],P,530742520);E=l(E,S,x,w,d[v+2],H,3299628645);w=c(w,E,S,x,d[v+0],B,4096336452);x=c(x,w,E,S,d[v+7],j,1126891415);S=c(S,x,w,E,d[v+14],F,2878612391);E=c(E,S,x,w,d[v+5],I,4237533241);w=c(w,E,S,x,d[v+12],B,1700485571);x=c(x,w,E,S,d[v+3],j,2399980690);S=c(S,x,w,E,d[v+10],F,4293915773);E=c(E,S,x,w,d[v+1],I,2240044497);w=c(w,E,S,x,d[v+8],B,1873313359);x=c(x,w,E,S,d[v+15],j,4264355552);S=c(S,x,w,E,d[v+6],F,2734768916);E=c(E,S,x,w,d[v+13],I,1309151649);w=c(w,E,S,x,d[v+4],B,4149444226);x=c(x,w,E,S,d[v+11],j,3174756917);S=c(S,x,w,E,d[v+2],F,718787259);E=c(E,S,x,w,d[v+9],I,3951481745);w=r(w,m);E=r(E,g);S=r(S,y);x=r(x,b)}var q=p(w)+p(E)+p(S)+p(x);return q.toLowerCase()}\
self.addEventListener( 'message', function (e)\
{\
var data = e.data;\
if( data )\
{\
    var i;\
    var hashData = data;\
    if( typeof( hashData ) === \"string\" )\
    {\
        var str = data;\
        hashData = new Uint16Array( str.length );\
        for( i=0; i<str.length; ++i )\
        {\
            hashData[i] = str.charCodeAt( i );\
        }\
    }\
    if( typeof( hashData ) === \"object\" )\
    {\
        var buffer = new Uint8Array( hashData );\
        hashData = \"\";\
        for( i=0; i<buffer.length; ++i )\
        {\
            hashData += buffer[i];\
        }\
    }\
    var result = md5( hashData );\
    self.postMessage( result );\
    self.close();\
}\
}, false );"], { "type" : "text\/javascript" } );

                // Obtain a blob URL reference to our worker 'file'.
                var blobURL = windowURL.createObjectURL( blob );
                window.workerMD5Async = blobURL;
            }

            window.md5AsyncWorking = true;
            var worker = new Worker( window.workerMD5Async );
            worker.addEventListener( 'message', function(e)
            {
                delete window.md5AsyncWorking;

                var result = e.data;
                callback( result );

                if( window.md5AsyncQueue )
                {
                    var next = window.md5AsyncQueue.pop();
                    if( window.md5AsyncQueue.length === 0 )
                    {
                        delete window.md5AsyncQueue;
                    }
                    md5Async( next.data, next.callback );
                }
            }, false);
            worker.postMessage( data );
        }
        else
        {
            var result = md5( data );
            callback( result );
        }
    }
}