// your file input
document.querySelector("#uploadNow").addEventListener("click", function () {
  var files=document.getElementById('form-file').files;
  var file;
  var i;
  var res_count=0;
  var xhrs=[];

    for(i=0; i<files.length;i++){
      file=files[i];

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

  xhrs[i] = $.ajaxSettings.xhr();
  xhrs[i].upload.onprogress = function(evt) {
    document.querySelector('#progress').textContent =parseInt(evt.loaded / evt.total * 100) + '%';
    document.querySelector('#progress').style.display="block";
  };
  xhrs[i].onreadystatechange = function(xhr) {
    if (xhr.target.readyState === 4) {
res_count++;
console.log(res_count, files.length);
      if(res_count==files.length){
        if(xhr.target.response.message=="success"){
          $('#progress').removeClass("alert-warning");
          $( "#progress" ).addClass( "alert-success" );
          location.reload();
        }
        else{
          if(xhr.target.response.desc=="file exists"){
            alert("duplicate file name! change file name");
          }
          else
          alert("something went wrong!");
        }
      }

    }
  }
  xhrs[i].responseType = 'json';
  xhrs[i].open('POST', '/upload'); // Url where you want to upload
  xhrs[i].send(form);
  }
    }


});


function delete_file(file_id, username_C) {
  var username_d=username_C;

  fetch("/delete_file", {
    method: "DELETE",
    body: JSON.stringify({file_id, username_d}),
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

function pre_delete_file(file_id, username_C) {
  var username_d=username_C;
  var files_ids=[];
  files_ids.push(file_id);

  var userChoice =confirm("are you sure you wanna delete the file?");
  if(!userChoice)
  return false;

  fetch("/predelete", {
    method: "POST",
    body: JSON.stringify({files_ids, username_d}),
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


document.querySelector("#del-multiple").addEventListener("click", function (e) {
  var files_ids=[];
  document.querySelectorAll(".check-file").forEach(function (checkbox) {
    if(checkbox.checked)
    files_ids.push(checkbox.name);
  });
  var userChoice =confirm("are you sure you wanna delete "+files_ids.length+" files?");
if(!userChoice)
return false;

  fetch("/predelete", {
    method: "POST",
    body: JSON.stringify({files_ids}),
    headers: {
        'content-type': 'application/json'
    }
}).then(data=>{return data.json();}).then(function (res) {
    if(res.message=="success")
    location.reload();
    else
    alert("something went wrong!");
});
});


function sizing() {
  var screenH=window.innerHeight;
var leftH=screenH-document.querySelector("#head").clientHeight;
document.querySelector("#storage").style.height=leftH+"px";
}
sizing();
window.addEventListener("resize", sizing);
