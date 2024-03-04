window.onload = FetchTeamData();
window.onload = FetchMembers();

window.addEventListener('click', function(e){
    var ActiveElements = document.getElementsByClassName("active");
    for(var i=0; i<ActiveElements.length; i++){ if(!ActiveElements[i].contains(e.target)) ActiveElements[i].classList.toggle("active");}
});

document.getElementById("add-member-btn").addEventListener("click", OpenNewMemberPrompt);
document.getElementById("cancel-btn").addEventListener("click", CloseNewMemberPrompt);
document.getElementById("submit-btn").addEventListener("click", AddNewMember);
document.getElementById("team-tshirt-color-input").addEventListener("input", function(e){
    document.getElementById("tshirtcolor-input").value = this.value;
    ChangeTShirtColor();
});
document.getElementById("tshirt-hex-input").addEventListener("input", ChangeTShirtHEX);
document.getElementById("text-color-input").addEventListener("input", ChangeTextColor);
document.getElementById("managers-text-input").addEventListener("input", ChangeManagerText);
document.getElementById("team-leaders-text-input").addEventListener("input", ChangeTeamLeaderText);
document.getElementById("team-members-text-input").addEventListener("input", ChangeTeamMemberText);
document.getElementById("coaches-text-input").addEventListener("input", ChangeCoachText);
document.getElementById("designers-text-input").addEventListener("input", ChangeDesignerText);

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
        var response = await fetch('/teams/temp-upload', {method: "PUT", body: formData});
        /*var response = await fetch(`/teams/add-members-batch/${teamUUID}`, {
            method: "PUT",
            body: formData
        });*/
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
        document.getElementById("team-tshirt-color-input").value = responseData.TShirtColor;
        if(responseData.TShirtHEX) document.getElementById("tshirt-hex-input").value = responseData.TShirtHEX;
        else document.getElementById("tshirt-hex-input").setAttribute("placeholder", `Default: #000000`);
        if(responseData.TShirtTextColor) document.getElementById("text-color-input").value = responseData.TShirtTextColor;
        else document.getElementById("text-color-input").setAttribute("placeholder", `Default: black`);
        if(responseData.ManagersText) document.getElementById("managers-text-input").value = responseData.ManagersText;
        else document.getElementById("managers-text-input").setAttribute("placeholder", `Default: ${responseData.TeamName} Manager`);
        if(responseData.TeamLeadersText) document.getElementById("team-leaders-text-input").value = responseData.TeamLeadersText;
        else document.getElementById("team-leaders-text-input").setAttribute("placeholder", `Default: ${responseData.TeamName} Team Leader`);
        if(responseData.TeamMembersText) document.getElementById("team-members-text-input").value = responseData.TeamMembersText;
        else document.getElementById("team-members-text-input").setAttribute("placeholder", `Default: ${responseData.TeamName}`);
        if(responseData.CoachesText) document.getElementById("coaches-text-input").value = responseData.CoachesText;
        else document.getElementById("coaches-text-input").setAttribute("placeholder", `Default: ${responseData.TeamName} Coach`);
        if(responseData.DesignersText) document.getElementById("designers-text-input").value = responseData.DesignersText;
        else document.getElementById("designers-text-input").setAttribute("placeholder", `Default: ${responseData.TeamName} Designer`);
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
async function ChangeTShirtHEX(){
    console.log("test");
    var URL = (document.location.href).split('/');
    var teamUUID = URL[URL.length-1];
    var HEXValue = document.getElementById("tshirt-hex-input").value;
    var response = await fetch(`/teams/tshirt-hex/${teamUUID}`,{
        method: "PUT",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({HEXValue: HEXValue})
    });
    if(response.status != 200){
        window.alert("An error occured in the server, please try again later.");
    }
}
async function ChangeTextColor(){
    var URL = (document.location.href).split('/');
    var teamUUID = URL[URL.length-1];
    var TextColor = (document.getElementById("text-color-input").value).toLowerCase();
    var response = await fetch(`/teams/tshirt-text-color/${teamUUID}`,{
        method: "PUT",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({TextColor: TextColor})
    });
    if(response.status != 200){
        window.alert("An error occured in the server, please try again later.");
    }
}
async function ChangeManagerText(){
    var URL = (document.location.href).split('/');
    var teamUUID = URL[URL.length-1];
    var ManagersText = document.getElementById("managers-text-input").value;
    var response = await fetch(`/teams/managers-text/${teamUUID}`,{
        method: "PUT",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({ManagersText: ManagersText})
    });
    if(response.status != 200){
        window.alert("An error occured in the server, please try again later.");
    }
}
async function ChangeTeamLeaderText(){
    var URL = (document.location.href).split('/');
    var teamUUID = URL[URL.length-1];
    var TeamLeadersText = document.getElementById("team-leaders-text-input").value;
    var response = await fetch(`/teams/team-leaders-text/${teamUUID}`,{
        method: "PUT",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({TeamLeadersText: TeamLeadersText})
    });
    if(response.status != 200){
        window.alert("An error occured in the server, please try again later.");
    }
}
async function ChangeTeamMemberText(){
    var URL = (document.location.href).split('/');
    var teamUUID = URL[URL.length-1];
    var TeamMembersText = document.getElementById("team-members-text-input").value;
    var response = await fetch(`/teams/team-members-text/${teamUUID}`,{
        method: "PUT",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({TeamMembersText: TeamMembersText})
    });
    if(response.status != 200){
        window.alert("An error occured in the server, please try again later.");
    }
}
async function ChangeCoachText(){
    var URL = (document.location.href).split('/');
    var teamUUID = URL[URL.length-1];
    var CoachesText = document.getElementById("coaches-text-input").value;
    var response = await fetch(`/teams/coaches-text/${teamUUID}`,{
        method: "PUT",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({CoachesText: CoachesText})
    });
    if(response.status != 200){
        window.alert("An error occured in the server, please try again later.");
    }
}
async function ChangeDesignerText(){
    var URL = (document.location.href).split('/');
    var teamUUID = URL[URL.length-1];
    var DesignersText = document.getElementById("designers-text-input").value;
    var response = await fetch(`/teams/designers-text/${teamUUID}`,{
        method: "PUT",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({DesignersText: DesignersText})
    });
    if(response.status != 200){
        window.alert("An error occured in the server, please try again later.");
    }
}