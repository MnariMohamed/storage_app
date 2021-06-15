function sizing(selector) {
    var screenH=window.innerHeight;
  var leftH=screenH-document.querySelector("#head").clientHeight;
  document.querySelector(selector).style.height=leftH+"px";
  }