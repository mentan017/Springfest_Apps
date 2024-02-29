window.onload = FetchTeamData();
window.onload = FetchMembers();

window.addEventListener('click', function(e){
    var ActiveElements = document.getElementsByClassName("active");
    for(var i=0; i<ActiveElements.length; i++){ if(!ActiveElements[i].contains(e.target)) ActiveElements[i].classList.toggle("active");}
});

document.getElementById("add-member-btn").addEventListener("click", OpenNewMemberPrompt);
document.getElementById("cancel-btn").addEventListener("click", CloseNewMemberPrompt);
document.getElementById("submit-btn").addEventListener("click", AddNewMember);

function OpenNewMemberPrompt(){
    document.getElementById("new-member-supercontainer").style.display = "grid";
}
function CloseNewMemberPrompt(){
    document.getElementById("new-member-supercontainer").style.display = "none";
}
async function AddNewMember(){
    //Check if it is a batch upload or an individual upload
    var name = document.getElementById("name-input").value;    
    var file = document.getElementById("team-members-file").files;
    if(name){ //Individual upload
        AddNewIndividualMember();
    }else if(file.length){
        AddNewBatchMembers();
    }
}
async function AddNewIndividualMember(){
    var name = document.getElementById("name-input").value;
    var email = document.getElementById("email-input").value;
    var role = document.getElementById("role-input").value;
    var tShirtSize = document.getElementById("tshirtsize-input").value;
    var URL = (document.location.href).split('/');
    var teamUUID = URL[URL.length-1];
    if(name && email && role && tShirtSize){
        var response = await fetch(`/teams/add-member/${teamUUID}`, {
            method: "PUT",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({Fullname: name, Email: email, Role: role, TShirtSize: tShirtSize})
        });
        if(response.status == 200){
            var responseData = await response.json();
            AddNewMemberElement({
                Fullname: name,
                Email: email,
                Role: role,
                TShirtSize: tShirtSize,
                UUID: responseData.UUID
            });
            CloseNewMemberPrompt();
        }else if(response.status == 401){
            var responseData = await response.json();
            window.alert(responseData.Error);
        }
    }
}
async function AddNewBatchMembers(){
    var URL = (document.location.href).split('/');
    var teamUUID = URL[URL.length-1];
    var files = document.getElementById("team-members-file").files;
    if(files.length > 0){
        var file = files[0];
        var formData = new FormData();
        var blob = file.slice(0, file.size, file.type);
        formData.append('files', new File([blob], file.name, {type: file.type}));
        var response = await fetch(`/teams/temp-upload`, {
            method: "PUT",
            body: formData
        });
        if(response.status == 200){
            CloseNewMemberPrompt();
            window.location.reload();
        }
    }
}
function AddNewMemberElement(data){
    var memberContainer = document.createElement('div');
    memberContainer.setAttribute("data-uuid", data.UUID);
    memberContainer.innerHTML = `
    <select class="member-role">
        <option value="manager">Manager</option>
        <option value="team-leader">Team Leader</option>
        <option value="team-member">Team Member</option>
        <option value="coach">Coach</option>
        <option value="designer">Designer</option>
        </select>
    <p>${data.Fullname}</p>
    <p>${data.Email}</p>
    <p>${data.TShirtSize}</p>`;
    memberContainer.firstElementChild.value = data.Role;
    document.getElementById("members-container").appendChild(memberContainer);
}
async function FetchTeamData(){
    var URL = (document.location.href).split('/');
    var teamUUID = URL[URL.length-1];
    var response = await fetch(`/teams/team-data/${teamUUID}`, {
        method: "POST",
        headers: {"Content-type": "application/json"}
    });
    if(response.status == 200){
        var responseData = await response.json();
        document.getElementById("team-name").innerHTML = `Team: ${responseData.TeamName}`;
        document.getElementById("team-summary").innerHTML = `
        <p>Managers: ${responseData.Managers}</p>
        <p>Team Leaders: ${responseData.TeamLeaders}</p>
        <p>Members: ${responseData.TeamMembers}</p>
        <p>Coaches: ${responseData.Coaches}</p>
        <p>Designers: ${responseData.Designers}</p>
        <div class="tshirtcolor"><p>T-Shirt color: </p><p id="tshirtcolor-text">${responseData.TShirtColor}</p><input style="display: none;" id="tshirtcolor-input" type="text" value="${responseData.TShirtColor}">`;
    }
    document.getElementById("tshirtcolor-text").addEventListener("click", function(e){
        this.parentElement.classList.toggle("active");
    });
    document.getElementById("tshirtcolor-input").addEventListener("change", ChangeTShirtColor);
}
async function FetchMembers(){
    var URL = (document.location.href).split('/');
    var teamUUID = URL[URL.length-1];
    var response = await fetch(`/teams/get-members/${teamUUID}`, {
        method: "POST",
        headers: {"Content-type": "application/json"}
    });
    if(response.status == 200){
        var responseData = await response.json();
        for(var i=0; i<responseData.length; i++){
            AddNewMemberElement(responseData[i]);
        }
        ListenRoles();
    }
}
async function ChangeTShirtColor(){
    var URL = (document.location.href).split('/');
    var teamUUID = URL[URL.length-1];
    var color = document.getElementById("tshirtcolor-input").value;
    document.getElementById("tshirtcolor-text").innerText = color;
    var response = await fetch(`/teams/tshirt-color/${teamUUID}`, {
        method: "PUT",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({Color: color})
    });
    if(response.status != 200){
        window.alert("An error occured in the server, please try again later.");
    }
}
function ListenRoles(){
    var roleElements = document.getElementsByClassName("member-role");
    for(var i=0; i<roleElements.length; i++){
        roleElements[i].addEventListener("change", async function(e){
            var userUUID = this.parentElement.getAttribute("data-uuid");
            var role = this.value;
            var URL = (document.location.href).split('/');
            var teamUUID = URL[URL.length-1];
            var response = await fetch('/teams/update-role', {
                method: "PUT",
                headers: {"Content-type": "application/json"},
                body: JSON.stringify({TeamUUID: teamUUID,UserUUID: userUUID, Role: role})
            });
            if(response.status != 200){
                window.alert("An error occured in the server, please try again later.");
            }
        });
    }
}