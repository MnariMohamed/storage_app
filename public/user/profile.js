function showPassword(){
  if($('#inputPassword').attr("type")=="password")
  $('#inputPassword').attr("type","text");
  else{
    $('#inputPassword').attr("type","password");
  }
}  
  
  $(".alert").hide();
function update_user(username, allowed_storage, old_cap) {
  var n_username=$("#inputUsername").val();
  let new_pass=$("#inputPassword").val();
  var capacity=$("#capacity").val();
 var allowedStorage=parseFloat(allowed_storage);

 var cap_dif=capacity-parseFloat(old_cap);
 if(cap_dif>allowedStorage){
  $("#userupdated").hide();
  $("#updatefailed").show("slow");
  alert("not enough allowed storage");
   return false;
 }

  fetch("/update/user", {
    method: "PUT",
    body: JSON.stringify({username, capacity, n_username, new_pass}),
    headers: {
        'content-type': 'application/json'
    }
}).then(data=>{return data.json();}).then(function (res) {
    if(res.message=="success"){
      $("#updatefailed").hide();
      $("#userupdated").show("slow", function () {
        location.reload();
      });
    }
    else if(res.description=="space not enough"){
      $("#userupdated").hide();
      $("#updatefailed").show("slow");
      alert("not enough space");
    }
    else{
      $("#userupdated").hide();
      $("#updatefailed").show("slow");
    }
});
}

//delete user
function delete_user(username) {
  
  var userChoice =
   prompt("*****Important please read before Confirming*******\r\nDelete files too?\r\nusername-all to delete user and his files.\r\nusername to delete only user.");
var deleteFiles=false;
if(userChoice==username+"-all" || userChoice==username){
  if(userChoice==username+"-all")
  deleteFiles=true;
  else{
     deleteFiles=false;
  }

          fetch("/user", {
              method: "DELETE",
              body: JSON.stringify({username, deleteFiles}),
              headers: {
                  'content-type': 'application/json'
              }
          }).then(data=>{return data.json();}).then(function (res) {
              if(res.message=="success")
              window.location.href = "/users";
            });
}
else
return;
}






function redirectTo() {
  window.location.href = "/users";
}
sizing(".background-container");
window.addEventListener("resize", function () {
  sizing(".background-container");
});