function delete_file(file_id, username_d, deleted_u=false) {
    var userChoice =confirm("are you sure you wanna delete the file?");
  if(!userChoice)
  return false;

    fetch("/delete_file", {
      method: "DELETE",
      body: JSON.stringify({file_id, username_d, deleted_u}),
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
    var userChoice =confirm("are you sure you wanna delete the user and his files?");
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
