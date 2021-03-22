document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    document.querySelector('#compose-form').onsubmit = () => {
        let recipients = document.querySelector('#compose-recipients').value;
        let subject = document.querySelector('#compose-subject').value;
        let body = document.querySelector('#compose-body').value;

        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({recipients, subject, body})
        }).then(response => response.json())
            .then(data => {
                    if (!data.error) {
                        myAlert('success', 'Sent', data.message)
                        load_mailbox('sent');
                    } else
                        myAlert('error', 'Opps', data.error)
                }
            )
        return false;
    }
    load_mailbox('inbox');
});

function myAlert(icon, title, message) {
    Swal.fire({
        icon: icon,
        title: title,
        text: message,
        timer: 1500
    })
}

function compose_email(event,recipients='',subject='',body='') {

    document.querySelector('#mail-content').style.display = 'none';
    document.querySelector('#mail').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = recipients;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = body;
}

function load_mailbox(option) {

    document.querySelector('#mail-content').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#mail').style.display = 'none';
    document.querySelector('#emails-view').innerHTML = `<h3>${option.charAt(0).toUpperCase() + option.slice(1)}</h3>`;

    fetch(`/emails/${option}`)
        .then(response => response.json())
        .then(emails => {
            function extracted(text) {
                content = `
                     <div class="card card-primary">
                          <div class="card-header">
                            <h3 class="card-title">Info</h3>
                          </div>
                        <div class="card-body">
                            <h1>${text}</h1>
                        </div>
                </div>
                `
                return content
            }
            if (emails.length > 0) {
                emails.forEach(email => {
                    let tdata = document.createElement('tr')
                    tdata.innerHTML = `
                    <td>
                      <div class="icheck-primary">
                        <input type="checkbox" value="" id="check1">
                        <label for="check1"></label>
                      </div>
                    </td>
                    <td class="mailbox-star"><a href="#"><i class="fas fa-star-o"></i></a></td>
                    <td class="mailbox-name">${email.sender}</td>
                    <td class="mailbox-subject"> ${email.subject}</td>
                    <td class="">${email.body} </td>
                    <td class="mailbox-date">${email.timestamp} </td>
                    `
                    tdata.addEventListener('click', function () {
                        fetch(`/emails/${email.id}`)
                            .then(response => response.json())
                            .then(email => {
                                if (!email.read) {
                                    fetch(`/emails/${email.id}`, {
                                        method: 'PUT',
                                        body: JSON.stringify({read: true})
                                    })
                                        .then(response => {
                                            console.log(`${response.status}`)
                                        })
                                }
                                loadEmail(email, option)
                            })
                            .catch(e => console.log(e));
                    })
                    tdata.style.backgroundColor = "white";
                    if (email.read) tdata.style.backgroundColor = "#F0F0F0";
                    document.querySelector("#emails-view").append(tdata)
                })
            }
            else {
                let div= document.createElement('div');
                console.log(option)
                if (option ==='inbox') {
                    myAlert('info','Info',"You don't sent email")
                    div.innerHTML=extracted("You don't have email");
                }
                else if (option==='sent'){
                    myAlert('info','Info','"You have not sent email"')
                    div.innerHTML= extracted("You have not sent email");
                }
                else if (option === 'archive') {
                    myAlert('info','Info','You don\'t have archived emails')
                    div.innerHTML = extracted("You don't have archived emails");
                }
                document.querySelector("#emails-view").append(div)
            }
        });
}

function loadEmail(email, option) {
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#mail-content').style.display = 'none';
    document.querySelector('#mail').style.display = 'block';
    //document.querySelector('#emails-view').style.display = 'none';
    let mail = document.querySelector('#mail')
    let content =
        `
        <div class="card card-primary card-outline">
            <div class="card-header">
                <h3 class="card-title">Read Mail</h3>
            </div>
            <div class="card-body p-0">
                <div class="mailbox-read-info">
                    <h5>${email.subject}</h5>
                    <h6> From: ${email.sender}
                        <span class="mailbox-read-time float-right">${email.timestamp}</span>
                    </h6>
                    <h6>To: ${email.recipients}
                        </h6>
                </div>
                <div class="mailbox-read-message">
                       <pre>` +email.body + `</pre>
                </div>
            </div>
        </div>
        `
    console.log(email.body)
    let caja = document.createElement('div')
    caja.className = 'd-flex justify-content-center card-footer'
    mail.innerHTML = content;
    let Pbutton = createbutton('Reply', 'btn btn-primary')
    Pbutton.addEventListener('click',function (e){
        let content = email.subject
          if (!email.subject.startsWith("Re: ")) {
          content = `Re: ${content}`
        }
        let body = `On ${email.timestamp} \n${email.sender}\nWrote:\n${email.body}\n--------\n`
        let recipient = email.sender;
        compose_email(event, recipient, content, body)
    })
    function createbutton(text, clas) {
        let button2 = document.createElement('button')
        button2.innerText = text
        button2.className = clas
        return button2;
    }

    function requirements(button, icon, title, message, bool) {
        button.addEventListener('click', function () {
            fetch(`/emails/${email.id}`, {
                method: 'PUT',
                body: JSON.stringify({archived: bool})
            }).then(response => {
                myAlert(icon, title, message);
                load_mailbox('inbox');
            })
        })
    }

    let button;
    if (option === 'inbox') {
        button = createbutton('Archive', 'btn btn-success');
        requirements(button, 'info', 'Archive', 'Archived mail correctly', true);
        caja.append(button, Pbutton)
        mail.append(caja)
    } else if (option === 'archive') {
        button = createbutton('Unarchive', 'btn btn-success')
        requirements(button, 'info', 'Unarchive', 'Unarchived mail correctly', false);
        caja.append(button, Pbutton)
        mail.append(caja)
    }
}