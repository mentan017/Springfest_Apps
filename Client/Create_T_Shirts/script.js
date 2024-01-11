document.getElementById("submit-btn").addEventListener("click", CreateTShirt);

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
            document.getElementById("t-shirt-img").setAttribute("src", `/images/t-shirt-${colorName}.png`);
            document.getElementById("download-btn-link").setAttribute("href", `/download-t-shirt/t-shirt-${colorName}.png`)
            document.getElementById("img-container").style.display = "grid";
        }
    }
}