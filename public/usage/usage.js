$( document ).ready(function() {
  reset_inputs();
});
function delete_file(file_id, username_d, deleted_u = false, file_name, user_id, b_id) {
  var userChoice = confirm("are you sure you wanna delete \r\n" + file_name + " ?");
  if (!userChoice)
    return false;

  var files_ids = [];
  files_ids.push(file_id);
  fetch("/delete_files", {
    method: "DELETE",
    body: JSON.stringify({ files_ids, username_d, deleted_u }),
    headers: {
      'content-type': 'application/json'
    }
  }).then(data => { return data.json(); }).then(function (res) {
    if (res.message == "success") {
      update_user_space(user_id);
      if(!b_id.includes("search")){
        document.querySelector("#" + b_id).parentElement.parentElement.style.display = "none";
        var tr_count = 0;
        var current_table = document.querySelector("#" + b_id).parentElement.parentElement.parentElement;
        Array.prototype.forEach.call(current_table.children, (tr) => {
          if (tr.style.display != "none")
            tr_count++;
        });
        if (tr_count <= 1) {
          current_table.closest("details").style.display = "none";
        }
      }
      else{
        location.reload();
      }
      reset_inputs();
        }
    else
      alert("something went wrong!");
  });
};

function delete_folder(username, folder_name) {
  var userChoice = confirm("are you sure you wanna delete " + username + " and his files?");
  if (!userChoice)
    return false;

  fetch("/delete_folder", {
    method: "DELETE",
    body: JSON.stringify({ username, folder_name }),
    headers: {
      'content-type': 'application/json'
    }
  }).then(data => { return data.json(); }).then(function (res) {
    if (res.message == "success")
      location.reload();
    else
      alert("something went wrong!");
  });
};


//delete multiple files
function delete_multiple(class_name, username_d, deleted_u = false, user_id) {
  var files_ids = [];
  var files_list = "";
  document.querySelectorAll("." + class_name).forEach(function (checkbox) {
    if (checkbox.checked) {
      files_ids.push(checkbox.name);
      files_list += "\r\n" + checkbox.parentElement.parentElement.getAttribute("name");
    }
  });
  var userChoice = confirm("are you sure you wanna delete \r\n" + files_list + " \r\n?");
  if (!userChoice)
    return false;

  var ids;
  files_ids.forEach(function (file_id, idx, arr) {
    ids = [file_id];
    fetch("/delete_files", {
      method: "DELETE",
      body: JSON.stringify({ files_ids: ids, username_d, deleted_u }),
      headers: {
        'content-type': 'application/json'
      }
    }).then(data => { return data.json(); }).then(function (res) {
      if (idx === arr.length - 1) {
        if (res.message == "success") {
          document.querySelectorAll("." + class_name).forEach(function (checkbox, check_index, check_arr) {
            if (checkbox.checked) {
              console.log(checkbox.parentElement.parentElement);
              checkbox.checked = false;
              checkbox.parentElement.parentElement.style.display = "none";
            }
            //hide detail
            if (check_index == check_arr.length - 1) {
              var tr_count = 0;
              var current_table = checkbox.parentElement.parentElement.parentElement;
              Array.prototype.forEach.call(current_table.children, (tr, tr_indx, tr_arr) => {
                if (tr.style.display != "none")
                  tr_count++;
                if (tr_indx == tr_arr.length - 1) {
                  if (tr_count <= 1) {
                    current_table.parentElement.parentElement.parentElement.parentElement.style.display = "none";
                  }
                  reset_inputs();
                }
              });

            }
          });
          update_user_space(user_id);
        } else
          alert("something went wrong!");
      }

    });
  })

}


//hide empty deleted files lists
function hide_details() {
  var n_d = document.querySelectorAll(".deleted-files-details");
  var n_trs;
  n_d.forEach(function (e) {
    n_trs = e.querySelectorAll(".del-f-tr").length;
    if (n_trs == 0)
      e.style.display = "none";
  })
}
hide_details();


//restore file
function restore_file(file_id, file_name, free_space, file_size, user_id, b_id) {
  var free_space = parseFloat(free_space);
  var file_size = parseFloat(file_size);

  if (free_space < file_size) {
    alert("!* the user has no enough space *!");
    return false;
  }
  var userChoice = confirm("are you sure you wanna restore \r\n" + file_name + " ?");
  if (!userChoice)
    return false;

  var files_ids = [];
  files_ids.push(file_id);
  fetch("/restore/file", {
    method: "PUT",
    body: JSON.stringify({ files_ids }),
    headers: {
      'content-type': 'application/json'
    }
  }).then(data => { return data.json(); }).then(function (res) {
    if (res.message == "success") {
      update_user_space(user_id);
      if(!b_id.includes("search")){
        document.querySelector("#" + b_id).parentElement.parentElement.style.display = "none";
        var tr_count = 0;
        var current_table = document.querySelector("#" + b_id).parentElement.parentElement.parentElement;
        Array.prototype.forEach.call(current_table.children, (tr) => {
          if (tr.style.display != "none")
            tr_count++;
        });
        if (tr_count <= 1) {
          current_table.closest("details").style.display = "none";
        }
      }
      else{
        location.reload();
      }
      reset_inputs();
    }
    else
      alert("something went wrong!");
  });
}

function restore_multiple(class_name, user_id, free_space) {
  var files_ids = [];
  var files_list = "";
  var total_size = 0;
  var free_space = parseFloat(free_space);
  document.querySelectorAll("." + class_name).forEach(function (checkbox, i, arr) {
    if (checkbox.checked) {
      files_ids.push(checkbox.name);
      console.log(i);
      total_size += parseFloat(document.querySelector("#check-c-u-" + i).getAttribute("data"));
      files_list += "\r\n" + checkbox.parentElement.parentElement.getAttribute("name");
    }
  });
  if (free_space < total_size) {
    alert("!* the user has no enough space *!");
    return false;
  }

  var userChoice = confirm("are you sure you wanna restore \r\n" + files_list + " \r\n?");
  if (!userChoice)
    return false;

  var ids;
  files_ids.forEach(function (file_id, idx, arr) {
    ids = [file_id];
    fetch("/restore/file", {
      method: "PUT",
      body: JSON.stringify({ files_ids: ids }),
      headers: {
        'content-type': 'application/json'
      }
    }).then(data => { return data.json(); }).then(function (res) {
      if (idx === arr.length - 1) {
        if (res.message == "success") {
          document.querySelectorAll("." + class_name).forEach(function (checkbox, check_index, check_arr) {
            if (checkbox.checked) {
              checkbox.checked = false;
              checkbox.parentElement.parentElement.style.display = "none";
            }
            //hide detail
            if (check_index == check_arr.length - 1) {
              var tr_count = 0;
              var current_table = checkbox.parentElement.parentElement.parentElement;
              Array.prototype.forEach.call(current_table.children, (tr, tr_indx, tr_arr) => {
                if (tr.style.display != "none")
                  tr_count++;
                if (tr_indx == tr_arr.length - 1) {
                  if (tr_count <= 1) {
                    current_table.parentElement.parentElement.parentElement.parentElement.style.display = "none";
                  }
                }
              });
              reset_inputs();
            }
          });
          update_user_space(user_id);
        }

        else
          alert("something went wrong!");
      }

    });
  })

}

//predelete file
function pre_delete_file(file_id, user_id, file_name) {
  var files_ids = [];
  files_ids.push(file_id);

  var userChoice = confirm("are you sure you wanna delete\r\n" + file_name + " ?");
  if (!userChoice)
    return false;

  fetch("/predelete", {
    method: "POST",
    body: JSON.stringify({ files_ids, user_id }),
    headers: {
      'content-type': 'application/json'
    }
  }).then(data => { return data.json(); }).then(function (res) {
    if (res.message == "success")
      location.reload();
    else if (res.keyword == "space") {
      alert(res.desc);
    }
    else
      alert("something went wrong!");
  });
};

//predelete multiple
function pre_delete_multi(user_index, user_id) {

  var files_ids = [];
  var files_list = "";
  document.querySelectorAll(".check-file-u-" + user_index).forEach(function (checkbox) {
    if (checkbox.checked) {
      files_ids.push(checkbox.name);
      files_list += "\r\n" + checkbox.parentElement.parentElement.getAttribute("name");
    }
  });
  var userChoice = confirm("are you sure you wanna delete \r\n" + files_list + " files?");
  if (!userChoice)
    return false;

  fetch("/predelete", {
    method: "POST",
    body: JSON.stringify({ files_ids, user_id }),
    headers: {
      'content-type': 'application/json'
    }
  }).then(data => { return data.json(); }).then(function (res) {
    if (res.message == "success")
      location.reload();
    else if (res.keyword == "space") {
      alert(res.desc);
    }
    else
      alert("something went wrong!");
  });
}



function search(e) {
  var searchValue = e.value;
  if(e.value.length==0){
    document.querySelector(".search-tbody").innerHTML = "";
    return false;
  } 
  fetch("/search/" + searchValue)
    .then(data => { return data.json(); }).then(function (res) {
      if (res.message == "success") {
        document.querySelector(".search-tbody").innerHTML = "";
        var deletedUser;
        var username;
        var restoreDisplay;
        var fileName;
        var user_id;
        var free_space;
        var del_pre;
        res.files.forEach(function (file, indx) {
          deletedUser = file.User ? false : true;
          user_id=deletedUser ? file.Deleted_user._id : file.User._id;
          username = deletedUser ? file.Deleted_user.username : file.User.username;
          free_space= deletedUser ? file.Deleted_user.free_space : file.User.free_space;
          restoreDisplay = file.pre_deleted ? "inline-block" : "none";
          fileName = file.name.split(' ').join('_');
          del_pre=file.pre_deleted? "delete_file('" + file._id + "','" + username + "','" + deletedUser + "','" + fileName + "','" + user_id + "','"+indx+"-search-del-"+ username +"')"
          : "pre_delete_file('" + file._id + "','" + user_id + "','" + fileName + "')";
          document.querySelector(".search-tbody").innerHTML += "<tr class='' name=''> <td><a href='/download_file/" + file._id + "'>" + file.name
            + "</a></td>  <td>" +
            username +
            "</td> <td>" +
            file.date+
          "</td> <td>" +
            file.size.toFixed(4) +
            "</td>  <td><button style='margin-right:1%' onclick="+del_pre+"; id='"+indx+"-search-del-"+ username +"' class='btn btn-danger'>Delete</button>" +
            "<button style='display: " + restoreDisplay + "' onclick=restore_file('" + file._id + "','" + fileName + "','" + free_space + "','" + file.size + "','" + user_id + "','search-rest-"+ username +"'); id='search-rest-"+ username +"' class='btn btn-success'>Restore</button>"
            + " </td> </tr>";
        });
      } else
        alert("something went wrong!");
    });
}




function update_user_space(user_id) {
  fetch("/update/user_space", {
    method: "POST",
    body: JSON.stringify({ user_id }),
    headers: {
      'content-type': 'application/json'
    }
  }).then(data => { return data.json(); }).then(function (res) {
    if (res.message == "success")
      return true;
    else
      alert("something went wrong!");
  });
}

//select files
function select_all(className) {
//  $("." + className).prop("checked", true);
  $("." + className).filter(function(){
    if($(this).parent().parent().css('display') != 'none')
    return $(this).prop("checked", !$(this).prop("checked"));
});
}

//empty inputs and uncheck boxes
function reset_inputs() {
  $("#searchInput").val("");
  $("input[type=checkbox]").prop("checked", false);
  document.querySelector(".search-tbody").innerHTML = "";
}

//resize
function usage_sizing(selector) {
  var screenH=window.innerHeight;
var leftH=screenH-document.querySelector("#head").clientHeight;
document.querySelector(selector).style.minHeight=(leftH*0.96)+"px";
}

usage_sizing(".in-container");
window.addEventListener("resize", function () {
  usage_sizing(".in-container");
});