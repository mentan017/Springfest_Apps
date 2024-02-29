window.onload = FetchMeetings();

document.getElementById("new-meeting-btn").addEventListener("click", OpenNewMeetingPrompt);
document.getElementById("meeting-type-input").addEventListener("change", function(e){
    if(this.value == "custom"){
        document.getElementById("custom-meeting-type").style.display = "block";
    }else{
        document.getElementById("custom-meeting-type").style.display = "none";
    }
});
document.getElementById("cancel-btn").addEventListener("click", CloseNewMeetingPrompt);
document.getElementById("submit-btn").addEventListener("click", SubmitNewMeeting);

function OpenNewMeetingPrompt(){
    document.getElementById("new-meeting-container").style.display = "grid";
}
function CloseNewMeetingPrompt(){
    document.getElementById("new-meeting-container").style.display = "none";
}

async function FetchMeetings(){
    var response = await fetch('/meetings/get-meetings', {method: "POST"});
    if(response.status == 200){
        var responseData = await response.json();
        for(var i=0; i<responseData.length; i++){
            DisplayMeeting(responseData[i]);
        }
        var meetingElements = document.getElementsByClassName("meeting");
        for(var i=0; i<meetingElements.length; i++){
            meetingElements[i].addEventListener("click", function(e){window.location.href = `/meetings/${this.getAttribute("data-uuid")}`;});
        }
    }else{
        window.alert("An error occured in the server, please try again later.");
    }
}
async function SubmitNewMeeting(){
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var meetingType = document.getElementById("meeting-type-input").value;
    if(meetingType == "custom") meetingType = document.getElementById("custom-meeting-type").value;
    var meetingPeriod = document.getElementById("period-input").value;
    var meetingDateRaw = document.getElementById("date-input").value;
    var meetingDateParts = meetingDateRaw.split("-");
    var meetingDate = `${months[parseInt(meetingDateParts[1])-1]} ${meetingDateParts[2]} ${meetingDateParts[0]}, ${meetingPeriod}`;
    var meetingRoom = document.getElementById("room-input").value || "/";
    if(meetingType && meetingDate && meetingPeriod){
        var response = await fetch('/meetings/new-meeting', {
            method: "PUT",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({MeetingType: meetingType, MeetingDateRaw: meetingDateRaw, MeetingDate: meetingDate, MeetingRoom: meetingRoom})
        });
        if(response.status == 200){
            var responseData = await response.json();
            document.location.href = `/meetings/${responseData.UUID}`;
        }else{
            window.alert("An error occured in the server, please try again later.")
        }
    }else{
        window.alert("You have to select a Meeting Type, a Meeting Date, and a Meeting Period (the first period of the meeting) to create a meeting");
    }
}
function DisplayMeeting(data){
    document.getElementById('meetings-container').innerHTML += `
    <div class="meeting" data-uuid="${data.UUID}">
        <p>${data.MeetingType}</p>
        <p>${data.DateStr}</p>
        <p>${data.Room}</p>
    </div>`
}