$(document).ready(function(){
    $(document).on ("click", ".deleteB", function (e) {

if(e.target.textContent=="Del")
{
    var userChoice =
     prompt("*****Important please read before Confirming*******\r\nDelete files too?\r\n'yes' to delete user and his files.\r\n'no' to delete only user.\r\n'cancel' to cancel everything");
var deleteFiles=false;
if(userChoice=="yes" || userChoice=="no"){
    if(userChoice=="yes")
    deleteFiles=true;
    else{
       deleteFiles=false;
    }
    var index="#username"+e.target.id;
    username=$(index).val();
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