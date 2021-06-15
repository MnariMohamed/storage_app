function delete_file(file_id, username_d, deleted_u=false, file_name) {
    var userChoice =confirm("are you sure you wanna delete \r\n"+file_name+" ?");
  if(!userChoice)
  return false;

  var files_ids=[];
  files_ids.push(file_id);
    fetch("/delete_files", {
      method: "DELETE",
      body: JSON.stringify({files_ids, username_d, deleted_u}),
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

  function delete_folder(username, folder_name) {
    var userChoice =confirm("are you sure you wanna delete "+username+" and his files?");
    if(!userChoice)
    return false;

    fetch("/delete_folder", {
        method: "DELETE",
        body: JSON.stringify({username, folder_name}),
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


//delete multiple files
function delete_multiple(class_name,username_d, deleted_u=false) {
    var files_ids=[];
    var files_list="";
    document.querySelectorAll("."+class_name).forEach(function (checkbox) {
      if(checkbox.checked){
        files_ids.push(checkbox.name);
        files_list+="\r\n"+checkbox.parentElement.parentElement.getAttribute("name");
      }
    });
    var userChoice =confirm("are you sure you wanna delete \r\n"+files_list+" \r\n?");
  if(!userChoice)
  return false;
  
  var ids;
  files_ids.forEach(function (file_id) {
      ids=[file_id];
      fetch("/delete_files", {
        method: "DELETE",
        body: JSON.stringify({files_ids:ids,username_d,deleted_u}),
        headers: {
            'content-type': 'application/json'
        }
    }).then(data=>{return data.json();}).then(function (res) {
        if(res.message=="success")
        location.reload();
        else
        alert("something went wrong!");
    });
  })

}


//hide empty deleted files lists
function hide_details() {
  var n_d = document.querySelectorAll( ".deleted-files-details" );
  var n_trs;
  n_d.forEach(function (e) {
    n_trs=e.querySelectorAll(".del-f-tr").length;
    if(n_trs==0)
    e.style.display="none";
    })
}
hide_details();


//restore file
function restore_file(file_id, file_name) {
  var userChoice =confirm("are you sure you wanna restore \r\n"+file_name+" ?");
  if(!userChoice)
  return false;

  var files_ids=[];
  files_ids.push(file_id);
    fetch("/restore/file", {
      method: "PUT",
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
}

function restore_multiple(class_name) {
  var files_ids=[];
  var files_list="";
  document.querySelectorAll("."+class_name).forEach(function (checkbox) {
    if(checkbox.checked){
      files_ids.push(checkbox.name);
      files_list+="\r\n"+checkbox.parentElement.parentElement.getAttribute("name");
    }
  });
  var userChoice =confirm("are you sure you wanna restore \r\n"+files_list+" \r\n?");
if(!userChoice)
return false;

var ids;
files_ids.forEach(function (file_id) {
    ids=[file_id];
    fetch("/restore/file", {
      method: "PUT",
      body: JSON.stringify({files_ids:ids}),
      headers: {
          'content-type': 'application/json'
      }
  }).then(data=>{return data.json();}).then(function (res) {
      if(res.message=="success")
      location.reload();
      else
      alert("something went wrong!");
  });
})

}



function search(e) {
  var searchValue=e.value;
  fetch("/search/"+searchValue)
  .then(data=>{return data.json();}).then(function (res) {
    if(res.message=="success")
{
  document.querySelector(".search-tbody").innerHTML="";
  var deletedUser;
  var username;
  var restoreDisplay;
  var fileName;
  res.files.forEach(function (file) {
    deletedUser=file.User? false : true;
    username=deletedUser? file.Deleted_user.username : file.User.username;
    restoreDisplay=file.pre_deleted? "inline-block": "none";
    fileName=file.name.split(' ').join('_');
    document.querySelector(".search-tbody").innerHTML+="<tr class='' name=''> <td><a href='/download_file/"+file._id+"'>"+file.name
    +"</a></td>  <td>"+                                                          
    file.date+
"</td> <td>"+
    file.size.toFixed(4)+
"</td>  <td><button style='margin-right:1%' onclick=delete_file('"+file._id+"','"+username+"','"+ deletedUser+"','"+ fileName+"'); id='' class='btn btn-danger'>Delete</button>"+
"<button style='display: "+restoreDisplay+"' onclick=restore_file('"+file._id+"','"+ fileName+"'); class='btn btn-success'>Restore</button>"
+" </td> </tr>";
  });
}    else
    alert("something went wrong!");
});
}

sizing("#usage");
window.addEventListener("resize", function () {
  sizing("#usage");
});
