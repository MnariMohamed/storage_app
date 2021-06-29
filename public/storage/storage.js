// your file input
document.querySelector("#uploadNow").addEventListener("click", async function () {
var should_continue=true;
  var files=document.getElementById('form-file').files;
  var file;
  var i;
  var res_count=0;
  var xhrs=[];
var files_s_G=0;
var free_sp=parseFloat(document.querySelector("#free_sp").textContent);
var username=document.querySelector("#username_sp").textContent;
var user_id=document.querySelector("#id_sp").textContent;

for(i=0; i<files.length;i++){
  file=files[i];
  files_s_G+=file.size / Math.pow(1000, 3);
  await fetch("/file_exitence/"+files[i].name+"/"+user_id)
  .then(data=>{return data.json();}).then(function (res) {
    if(res.message=="success")
{
  $('#progress').removeClass("alert-warning");
  $( "#progress" ).removeClass( "alert-success" );
  $( "#progress" ).addClass( "alert-danger" );
  alert("duplicate file name! change the name of '"+res.file_name+"'");
  $('#progress').removeClass("alert-danger");
  $( "#progress" ).removeClass( "alert-success" );
  $( "#progress" ).addClass( "alert-warning" );
  should_continue=false;
  return false;
} 
 });
}
//get user space
await fetch("/user_info/"+user_id)
.then(data=>{return data.json();}).then(function (res) {
  if(files_s_G>res.user.free_space){
document.querySelector('#progress').style.display="block";
$('#progress').removeClass("alert-warning");
$( "#progress" ).addClass( "alert-danger" );
$( "#progress" ).text(free_sp.toFixed(4)+" GB is not enough space!");
should_continue=false;
return false;
  }
});
  //if everything is ok to upload
if(should_continue==true){
  document.querySelector("#row-file").style.display="none";
  $(window).on("unload", function(e) {
    console.log(file.name);
});

  $(window).bind('beforeunload', async function(){
    return "Changes you made may not be saved.";
  });
}
//loop through files
    for(i=0; i<files.length;i++){
      if(should_continue==false)
      return false;

      file=files[i];


  // your form
  var form = new FormData();
  form.append('uploadedFile', file);
console.log(file.size);
  xhrs[i] = $.ajaxSettings.xhr();
  xhrs[i].upload.onprogress = function(evt) {
    document.querySelector('#progress').textContent =parseInt((evt.loaded / evt.total * 100)-1) + '% ';
    document.querySelector('#progress').style.display="inline-block";
  };
  xhrs[i].onreadystatechange = function(xhr) {
    if (xhr.target.readyState === 4) {
res_count++;
//currentFile=files[res_count];
console.log(res_count, files.length);
      if(res_count==files.length){
        $(window).off("unload");
        if(xhr.target.response.message=="success"){
          $('#progress').removeClass("alert-warning");
          $( "#progress" ).addClass( "alert-success" );
          document.querySelector('#progress').textContent ="100%";
          $(window).unbind('beforeunload');
          fetch("/update/user_space", {
            method: "POST",
            body: JSON.stringify({ user_id }),
            headers: {
              'content-type': 'application/json'
            }
          }).then(data => { return data.json(); }).then(function (res) {
            if(res.message=="success"){ window.location.href = "/storage"; }
          });
                        }
        else{
            alert("something went wrong!");
            $('#progress').removeClass("alert-warning");
            $( "#progress" ).removeClass( "alert-success" );
            $( "#progress" ).addClass( "alert-danger" );
            window.location.href = "/storage";
        }
      }

    }
  }
  xhrs[i].responseType = 'json';
  xhrs[i].open('POST', '/upload'); // Url where you want to upload
  await xhrs[i].send(form);
    }


});


function pre_delete_file(file_id, user_id, file_name) {
  var files_ids=[];
  files_ids.push(file_id);

  var userChoice =confirm("are you sure you wanna delete\r\n"+file_name+" ?");
  if(!userChoice)
  return false;

  fetch("/predelete", {
    method: "POST",
    body: JSON.stringify({files_ids, user_id}),
    headers: {
        'content-type': 'application/json'
    }
}).then(data=>{return data.json();}).then(function (res) {
    if(res.message=="success")
    window.location.href = "/storage";
    else if(res.keyword=="space"){
      alert(res.desc);
          }
    else{
      alert("something went wrong!");
    }
});
};


document.querySelector("#del-multiple").addEventListener("click", function (e) {
  var files_ids=[];
  var files_list="";
  document.querySelectorAll(".check-file").forEach(function (checkbox) {
    if(checkbox.checked){
      files_ids.push(checkbox.name);
      files_list+="\r\n"+checkbox.parentElement.parentElement.getAttribute("name");
    }
  });
  var userChoice =confirm("are you sure you wanna delete \r\n"+files_list+" files?");
if(!userChoice)
return false;

var user_id=$("#id_sp").text();
  fetch("/predelete", {
    method: "POST",
    body: JSON.stringify({files_ids, user_id}),
    headers: {
        'content-type': 'application/json'
    }
}).then(data=>{return data.json();}).then(function (res) {
    if(res.message=="success")
    window.location.href = "/storage";
    else if(res.keyword=="space"){
alert(res.desc);
    }
    else{
      alert("something went wrong!");
      window.location.href = "/storage";
    }
});
});

function select_all(className) {
  $("."+className).prop( "checked", true );
}

sizing("#storage");
window.addEventListener("resize", function () {
  sizing("#storage");
});
