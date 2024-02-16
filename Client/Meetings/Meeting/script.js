window.onload = FetchMeeting();

window.addEventListener('click', function(e){
    var ActiveElements = document.getElementsByClassName("active");
    for(var i=0; i<ActiveElements.length; i++){ if(!ActiveElements[i].contains(e.target)) ActiveElements[i].classList.toggle("active");}
})

document.getElementById("meeting-type").addEventListener("click", function(e){
    this.parentElement.classList.toggle("active");
});
document.getElementById("meeting-date").addEventListener("click", function(e){
    this.parentElement.classList.toggle("active");
});
document.getElementById("meeting-room").addEventListener("click", function(e){
    this.parentElement.classList.toggle("active");
});
document.getElementById("meeting-type-input").addEventListener("keyup", function(e){UpdateMeetingData();});
document.getElementById("meeting-date-input").addEventListener("keyup", function(e){UpdateMeetingData();});
document.getElementById("meeting-room-input").addEventListener("keyup", function(e){UpdateMeetingData();});

document.getElementById("add-discussion-point-btn").addEventListener("click", CreateDiscussionPoint);

async function FetchMeeting(){
    var URL = (document.location.href).split('/');
    var UUID = URL[URL.length-1];
    var response = await fetch(`/meetings/${UUID}`, {method: "POST"});
    if(response.status == 200){
        var responseData = await response.json();
        document.title = `${responseData.MeetingType} | ${responseData.DateStr}`;
        document.getElementById("meeting-type").innerHTML = responseData.MeetingType;
        document.getElementById("meeting-date").innerHTML = responseData.DateStr;
        document.getElementById("meeting-room").innerHTML = responseData.Room;        
        document.getElementById("meeting-type-input").value = responseData.MeetingType;
        document.getElementById("meeting-date-input").value = responseData.DateStr;
        document.getElementById("meeting-room-input").value = responseData.Room;        
        for(var i=0; i<responseData.DiscussionPoints.length; i++){
            AddDiscussionPoint(i, responseData.DiscussionPoints[i].Point, responseData.DiscussionPoints[i].Progress);
        }
        document.getElementById("notes").innerHTML = responseData.Notes;
        UpdateNotes(responseData.Notes);
    }else{
        window.alert("An error occured in the server, please try again later.");
    }
}
async function UpdateMeetingData(){
    var URL = (document.location.href).split('/');
    var UUID = URL[URL.length-1];
    var meetingType = document.getElementById("meeting-type-input").value;
    var meetingDate = document.getElementById("meeting-date-input").value;
    var meetingRoom = document.getElementById("meeting-room-input").value;
    document.getElementById("meeting-type").innerHTML = meetingType;
    document.getElementById("meeting-date").innerHTML = meetingDate;
    document.getElementById("meeting-room").innerHTML = meetingRoom;
    var response = await fetch('/meetings/update-meeting/', {
        method: "PUT",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({UUID: UUID, MeetingType: meetingType, MeetingDate: meetingDate, MeetingRoom: meetingRoom})
    });
}

async function CreateDiscussionPoint(){
    var URL = (document.location.href).split('/');
    var UUID = URL[URL.length-1];
    var response = await fetch('/meetings/new-discussion-point', {
        method: "PUT",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({UUID: UUID})
    });
    var responseData = await response.json();
    AddDiscussionPoint(responseData.index, "Click here to add a discussion point", 0);
}
async function AddDiscussionPoint(index, text, progress){    
    var discussionPoint = document.createElement("div");
    discussionPoint.className = "discussion-point";
    discussionPoint.setAttribute("data-index", index);
    var progressText = ['Undone', 'In Progress', 'Done'];
    var colors = ['red', 'orange', 'green'];
    var selectElement = '';
    for(var i=0; i<3; i++){
        if(progress == i) selectElement += `<option value="${i}" selected>${progressText[i]}</option>`;
        else selectElement += `<option value="${i}">${progressText[i]}</option>`;
    }
    discussionPoint.innerHTML = `
    <div>
        <p>${text}</p>
        <input type="text" value="${text}">
    </div>
    <div>
        <select style="color:${colors[progress]}">
        ${selectElement};
        </select>
    </div>`;
    document.getElementById("discussion-points-container").appendChild(discussionPoint);
    discussionPoint.firstElementChild.firstElementChild.addEventListener("click", function(e){
        this.parentElement.classList.toggle("active");
    });
    discussionPoint.firstElementChild.lastElementChild.addEventListener("keyup", function(e){
        UpdateDiscussionPoint(this.parentElement.parentElement.getAttribute("data-index"), this.parentElement.parentElement);
    });
    discussionPoint.lastElementChild.firstElementChild.addEventListener("change", function(e){
        UpdateDiscussionPoint(this.parentElement.parentElement.getAttribute("data-index"), this.parentElement.parentElement);
    });
}

async function UpdateDiscussionPoint(index, pointElement){
    var colors = ['red', 'orange', 'green'];
    var URL = (document.location.href).split('/');
    var UUID = URL[URL.length-1];
    var DiscussionPoint = pointElement.firstElementChild.lastElementChild.value;
    var Progress = pointElement.lastElementChild.firstElementChild.value;
    pointElement.firstElementChild.firstElementChild.innerHTML = DiscussionPoint;
    pointElement.lastElementChild.firstElementChild.style.color = colors[Progress];
    var response = await fetch('/meetings/update-discussion-point', {
        method: "PUT",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({UUID: UUID, Index: index, DiscussionPoint: DiscussionPoint, Progress: Progress})
    });
}
async function UpdateNotes(previousNotes){
    var URL = (document.location.href).split('/');
    var UUID = URL[URL.length-1];
    var notes = document.getElementById("notes").value;
    if(previousNotes != notes){
        var response = await fetch('/meetings/update-notes', {
            method: "PUT",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({UUID: UUID, Notes: notes})
        });
    }
    setTimeout(UpdateNotes, 1000, notes);
}