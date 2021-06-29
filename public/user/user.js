$(".alert").hide();
$(document).ready(function(){
    $("#addbutton").click(function () {
        var login=$("#inputUsername").val();
        let password=$("#inputPassword").val();
        var capacity=$("#capacity").val();
        var payload = {
            username: login,
            password,
            capacity
        };


        fetch("/register", {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                'content-type': 'application/json'
            }
        }).then(data=>{return data.json();}).then(function (res) {
if(res.message=="failed"){
    $("#userfailed").hide();
    $("#useradded").hide(1000);
    $("#userfailed").show(500, function () {
        location.reload();
    });
}
if(res.message=="success"){
    $("#useradded").hide();
    $("#useradded").show("slow", function () {
        window.location.href = "/users";
    });
    $("#userfailed").hide(1000);
}
        });
    });
});

function redirectTo() {
    window.location.href = "/users";
  }