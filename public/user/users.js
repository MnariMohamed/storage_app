$(document).ready(function(){
    $(document).on ("click", ".deleteB", function (e) {

if(e.target.textContent=="Del")
{
    var index=e.target.name+"-username";
    console.log(index);
    username=$("#"+index).val();
    console.log(username);

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
                location.reload();
            });
}
else
return;

    }
    
    else if(e.target.textContent=="Save"){
var username=e.target.id;
var capacity=$("#"+username+"-capacity").val();
var n_username=$("#"+username+"-username").val();
if(n_username.length<1){
    alert("insert more characters for username");
return false;
}
fetch("/update/user", {
    method: "PUT",
    body: JSON.stringify({username, capacity, n_username}),
    headers: {
        'content-type': 'application/json'
    }
}).then(data=>{return data.json();}).then(function (res) {
    if(res.message=="success")
    location.reload();
});
}

});
});



sizing(".background-container");
window.addEventListener("resize", function () {
  sizing(".background-container");
});
