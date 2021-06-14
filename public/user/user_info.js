document.querySelector("#confirm-pass").addEventListener("click", function () {
    let password=$("#inputOldPassword").val();
    let new_pass = $("#inputPassword").val();
    let confirm_pass = $("#inputConfirm").val();
    var username=$("#confirm-pass").attr("data");
    if (new_pass != confirm_pass) {
        $("#pass-failed").hide();
        $("#pass-changed").hide(1000);
        $("#pass-failed").show(1000);
alert("password confirmation is wrong");
        return false;
    }
    fetch("/update_info", {
        method: "POST",
        body: JSON.stringify({username, password, new_pass }),
        headers: {
            'content-type': 'application/json'
        }
    }).then(data => { return data.json(); }).then(function (res) {
        if (res.message == "failed") {
            $("#pass-failed").hide();
            $("#pass-changed").hide(1000);
            $("#pass-failed").show(1000);
        }
        if (res.message == "success") {
            $("#pass-changed").hide();
            $("#pass-changed").show(1000);
            $("#pass-failed").hide(1000);
            location.reload();
        }
    });
});