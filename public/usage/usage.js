function delete_file(path, username_d, deleted_u=false) {
  
    fetch("/delete_file", {
      method: "DELETE",
      body: JSON.stringify({path, username_d, deleted_u}),
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
