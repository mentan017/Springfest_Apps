document.getElementById("submit-btn").addEventListener("click", CreateTShirt);
document.getElementById("submit-file-btn").addEventListener("click", BatchCreateTShirts);

async function CreateTShirt(){
    var colorName = document.getElementById("color-name-input").value;
    var colorHEX = document.getElementById("color-hex-input").value;
    if(colorHEX.length == 6) colorHEX = "#" + colorHEX;
    if(colorHEX.length < 6){
        window.alert("The HEX value is not valid");
    }else{
        var response = await fetch('/create-t-shirt', {
            method: "POST",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({Color: colorName.toLowerCase(), HEX: colorHEX})
        });
        if(response.status == 200){
            document.getElementById("t-shirt-img").setAttribute("src", `/files/t-shirt-${colorName}.png`);
            document.getElementById("download-btn-link").setAttribute("href", `/download/t-shirt-${colorName}.png`)
            document.getElementById("img-container").style.display = "grid";
        }
    }
}
async function BatchCreateTShirts(){
    var files = document.getElementById("file-input").files;
    if(files.length > 0){
        var file = files[0];
        var formData = new FormData();
        var blob = file.slice(0, file.size, file.type);
        formData.append('files', new File([blob], file.name, {type: file.type}));
        var response = await fetch(`/batch-create-t-shirt`, {
            method: "POST",
            body: formData
        });
        if(response.status == 200){
            var responseData = await response.json();
            var uuid = responseData.UUID;
            document.getElementById("t-shirt-img").setAttribute("src", `/images/zip.jpg`);
            document.getElementById("download-btn-link").setAttribute("href", `/download/${uuid}.zip`)
            document.getElementById("img-container").style.display = "grid";
        }else{
            window.alert("An error occured in the server");
        }
    }else{
        window.alert("You have to upload a file");
    }
}