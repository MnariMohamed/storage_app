$(".alert").hide();
function update_user(username) {
  var n_username=$("#inputUsername").val();
  let new_pass=$("#inputPassword").val();
  var capacity=$("#capacity").val();

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

sizing("#profile");
window.addEventListener("resize", function () {
  sizing("#profile");
});