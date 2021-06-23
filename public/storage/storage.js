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
  if(username!="admin" && files_s_G>free_sp){
    document.querySelector('#progress').style.display="block";
    $('#progress').removeClass("alert-warning");
    $( "#progress" ).addClass( "alert-danger" );
    $( "#progress" ).text(free_sp.toFixed(4)+" GB is not enough space!")
  return false;
  }
  await fetch("/file_exitence/"+files[i].name+"/"+user_id)
  .then(data=>{return data.json();}).then(function (res) {
    if(res.message=="success")
{
  $('#progress').removeClass("alert-warning");
  $( "#progress" ).removeClass( "alert-success" );
  $( "#progress" ).addClass( "alert-danger" );
  alert("duplicate file name! change the name of '"+res.file_name+"'");
  should_continue=false;
  return false;
} 
 });

}
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
          var user_id=$("#id_sp").text();
          fetch("/update/user_space", {
            method: "POST",
            body: JSON.stringify({user_id}),
            headers: {
                'content-type': 'application/json'
            }
        }).then(data=>{return data.json();}).then(function (res) {
          if(res.message=="success")
          location.reload();
          else
          alert("something went wrong!");
        });
        }
        else{
            alert("something went wrong!");
            $('#progress').removeClass("alert-warning");
            $( "#progress" ).removeClass( "alert-success" );
            $( "#progress" ).addClass( "alert-danger" );
        }
      }

    }
  }
  xhrs[i].responseType = 'json';
  xhrs[i].open('POST', '/upload'); // Url where you want to upload
  xhrs[i].send(form);
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
    location.reload();
    else if(res.keyword=="space"){
      alert(res.desc);
          }
    else
    alert("something went wrong!");
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
    location.reload();
    else if(res.keyword=="space"){
alert(res.desc);
    }
    else
    alert("something went wrong!");
});
});

function select_all(className) {
  $("."+className).prop( "checked", true );
}

sizing("#storage");
window.addEventListener("resize", function () {
  sizing("#storage");
});
