window.onload = FetchTeams();

document.getElementById("new-team-btn").addEventListener("click", CreateTeam);

async function CreateTeam(){
    var TeamName = document.getElementById("team-name-input").value;
    if(TeamName){
        var response = await fetch('/teams/create-team', {
            method: "PUT",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({TeamName: TeamName})
        });
        if(response.status == 200){
            var responseData = await response.json();
            window.location.href = `/teams/${responseData.UUID}`;
        }else if(response.status == 401){
            var responseData = await response.json();
            window.alert(responseData.Error);
        }else{
            window.alert("An error occured in the server, please try again later.")
        }
    }
}
async function FetchTeams(){
    var response = await fetch('/teams/get-teams', {method: "POST"});
    if(response.status == 200){
        var responseData = await response.json();
        for(var i=0; i<responseData.length; i++){
            DisplayTeam(responseData[i]);
        }
        var teamElements = document.getElementsByClassName("team");
        for(var i=0; i<teamElements.length; i++){
            teamElements[i].addEventListener("click", function(e){window.location.href = `/teams/${this.getAttribute("data-uuid")}`;});
        }
    }else{
        window.alert("An error occured in the server, please try again later.");
    }
}
function DisplayTeam(data){
    document.getElementById('teams-container').innerHTML += `
    <div class="team" data-uuid="${data.UUID}">
        <p>${data.Name}</p>
        <p>${data.Managers}</p>
        <p>${data.Members}</p>
    </div>`;
}