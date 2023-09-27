document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(mail, reply=false)
{

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#mail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  if (reply === true)
  {
    document.querySelector('#compose-recipients').value = mail.sender;
    document.querySelector('#compose-subject').value = `Re: ${mail.subject}`;
    document.querySelector('#compose-body').value = `On ${mail.timestamp}, ${mail.recipients} wrote: ${mail.body}`;
  }

  // when submit buttons clicked in composition form, send email
  document.querySelector('#compose-form').onsubmit = function(event)
  {
    event.preventDefault();

    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value;

    fetch('/emails',
    {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
      })
    }) //fetch method closer
    .then(response => response.json())
    .then(result => {
      if (result.message === "Email sent successfully.")
      {

        load_mailbox('sent');
      }
    }) //then result closer

  } //query selector closer
} //function closer

function load_mailbox(mailbox)
{

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  if (mailbox === 'sent')
  {
    fetch('/emails/sent')
        .then(response => response.json())
        .then(emails => {
          mailboxFormat(emails, 'sent');
        }); //end then emails
  }//end if sent

  else if (mailbox === 'inbox')
  {
    fetch('/emails/inbox')
        .then(response => response.json())
        .then(emails => {
            mailboxFormat(emails, 'inbox');
          });//end then emails
  }//end else if inbox

  else if (mailbox === 'archive')
  {
    fetch('/emails/archive')
        .then(response => response.json())
        .then(emails => {
            mailboxFormat(emails, 'archive');
          });//end then emails
  }//end else if archive

} //end function

// returns JSON of the mail we sent
function mailboxFormat(emails, view)
{
  emails.forEach((element) =>
  {
    //div for each mail sent
    const entry = document.createElement('div');
    entry.style.border = '1px solid black';
    entry.style.display = 'flex';
    entry.style.justifyContent = 'space-between';
    entry.style.alignItems = 'center';
    entry.style.padding = '5px';

    const senderDiv = document.createElement('div');
    const timestampDiv = document.createElement('div');

    // Create a container for the sender and subject
    const senderSubjectContainer = document.createElement('div');
    senderSubjectContainer.style.display = 'flex'; // Use flex within the container

    // Create a div for the subject
    const subjectDiv = document.createElement('div');

    // Set the content of the sender and timestamp divs
    senderDiv.innerHTML = `<b>${element.sender}</b> &nbsp`;
    timestampDiv.textContent = element.timestamp;

    // Set a class or style for the subject div to control spacing
    subjectDiv.textContent = element.subject;


    // Append the sender and timestamp divs to the main entry div
    entry.appendChild(senderSubjectContainer); // Add the sender/subject container
    senderSubjectContainer.appendChild(senderDiv);
    senderSubjectContainer.appendChild(subjectDiv); // Add the subject to the container
    entry.appendChild(timestampDiv);

    entry.addEventListener('click', () => mailView(element, view));

    entry.addEventListener('mouseover', () => {
      entry.style.cursor = 'pointer'; // Change cursor to hand on hover
    });

    entry.addEventListener('mouseout', () => {
      entry.style.cursor = 'auto'; // Reset cursor on mouseout
    });

    document.querySelector('#emails-view').append(entry);

  });//endfor
}

//clicked on an email within respective inbox/view
function mailView(mail, view)
{

  if (view === 'sent')
  {
    mailContent(mail, view);
  }//end if sent

  else if (view === 'inbox')
  {
    mailContent(mail, view);

    //mark email as read
    let email_id = mail.id;
    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
  }//end if inbox

  else if (view === 'archive')
  {
    mailContent(mail, view);
  }

}

//what our actual email looks like after we click on it
function mailContent(mail, view)
{

  document.querySelector('#mail-view').innerHTML = '';

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'block';

  const entry = document.createElement('div');
  const header = document.createElement('hr');
  const body = document.createElement('div');

  entry.innerHTML = `<b>From: </b>${mail.sender}<br><b>To: </b>${mail.recipients}<br><b>Subject: </b>${mail.subject}<br><b>Timestamp: </b>${mail.timestamp}<br>`;
  document.querySelector('#mail-view').append(entry);

  if (view === 'inbox')
  {
    const arch = document.createElement('button');
    const reply = document.createElement('button');

    arch.id = 'archive';
    arch.className = 'btn btn-primary';
    arch.textContent = 'Archive';
    reply.id = 'reply';
    reply.className = 'btn btn-primary';
    reply.textContent = 'Reply';
    reply.style.marginRight = '7px';


    reply.addEventListener('click', function(){
      compose_email(mail, true);
    });

    document.querySelector('#mail-view').appendChild(reply);

    arch.addEventListener('click', function() {


      //mail has been archived, mark as such
      let email_id = mail.id;
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: true
        })
      })
      load_mailbox('inbox');
    });
    document.querySelector('#mail-view').appendChild(arch);
  }

  if (view === 'archive')
  {
    const arch = document.createElement('button');

    arch.id = 'unarchive';
    arch.className = 'btn btn-primary';
    arch.textContent = 'Unarchive';

    arch.addEventListener('click', function() {

      //mail has been unarchived, mark as such & redirect to inbox
      let email_id = mail.id;
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: false
        })
      })
      load_mailbox('inbox');
    });
    document.querySelector('#mail-view').appendChild(arch);
  }

  document.querySelector('#mail-view').appendChild(header);

  body.innerHTML = mail.body;

  document.querySelector('#mail-view').append(body);
}



