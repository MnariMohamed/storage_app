// your file input
document.querySelector("#uploadNow").addEventListener("click", function () {
    const file = document.getElementById('form-file').files[0];
    
    file_s_G=file.size / Math.pow(1000, 3);
    var username=document.querySelector("#username_sp").textContent;
    var free_sp=parseFloat(document.querySelector("#free_sp").textContent);
if(username!="admin" && file_s_G>free_sp){
  document.querySelector('#progress').style.display="block";
  $('#progress').removeClass("alert-warning");
  $( "#progress" ).addClass( "alert-danger" );
  $( "#progress" ).text(free_sp.toFixed(4)+" GB is not enough space!")
return false;
}
else{
// your form
var form = new FormData();
form.append('uploadedFile', file);

const xhr = $.ajaxSettings.xhr();
xhr.upload.onprogress = function(evt) {
  document.querySelector('#progress').textContent =parseInt(evt.loaded / evt.total * 100) + '%';
  document.querySelector('#progress').style.display="block";
};
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4) {
    if(xhr.response.message=="success"){
      $('#progress').removeClass("alert-warning");
      $( "#progress" ).addClass( "alert-success" );
      location.reload();
    }
    else{
      if(xhr.response.desc=="file exists"){
        alert("duplicate file name! change file name");
      }
      else
      alert("something went wrong!");
    }
  }
}
xhr.responseType = 'json';
xhr.open('POST', '/upload'); // Url where you want to upload
xhr.send(form);
}

});
function delete_file(path, username_C) {
  var username_d=username_C;

  fetch("/delete_file", {
    method: "DELETE",
    body: JSON.stringify({path, username_d}),
    headers: {
        'content-type': 'application/json'
    }
}).then(data=>{return data.json();}).then(function (res) {
    if(res.message=="success")
    location.reload();
    else
    alert("something went wrong!");
});
};

function pre_delete_file(path, username_C) {
  var username_d=username_C;

  fetch("/predelete", {
    method: "POST",
    body: JSON.stringify({path, username_d}),
    headers: {
        'content-type': 'application/json'
    }
}).then(data=>{return data.json();}).then(function (res) {
    if(res.message=="success")
    location.reload();
    else
    alert("something went wrong!");
});
};


function sizing() {
  var screenH=window.innerHeight;
var leftH=screenH-document.querySelector("#head").clientHeight;
document.querySelector("#storage").style.height=leftH+"px";
}
sizing();
window.addEventListener("resize", sizing);
