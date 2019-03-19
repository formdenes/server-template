const config = {
  backendURL: 'http://localhost:4000/',
  endPoints: {
    post: {
      link: 'api/links',
    }
  },
  messages: {
    error: 'Your alias is already in use!',
    serverError: 'No response from the server',
    elementMissing: 'Element is not present!',
  },
  colors: {
    messageDefault: '#000000',
    messageError: '#FF0000',
  }
}

window.addEventListener('load', function () {
  initSubmitButton();
  hideMessage();
  setMessageColor(config.colors.messageDefault);
});

function initSubmitButton() {
  const button = document.getElementById('submit-button');

  if (typeof button !== 'undefined') {
    button.onclick = function (event) {
      event.stopPropagation();
      event.preventDefault();
      postFormData();
    };
  } else {
    logError(config.messages.elementMissing);
  }
}

function postFormData() {
  const req = new XMLHttpRequest();
  req.addEventListener('load', processResponse);
  req.open('POST', config.backendURL + config.endPoints.post.link);
  req.setRequestHeader('Content-Type', 'application/json');
  req.send(JSON.stringify(getFormData()));
}

function getFormData() {
  return {
    url: document.getElementById('form-url').value,
    alias: document.getElementById('form-alias').value,
  }
}

function processResponse(data) {
  const status = data.target.status || 0;

  if (status === 200) {
    const response = JSON.parse(data.target.responseText);
    showSuccess(response);

  } else if (status === 400) {
    showError();

  } else {
    logError(config.messages.serverError);
  }
}

function showSuccess(data) {
  const msg = `Your URL is aliased to ${data.alias} and your secret code is ${data.secretCode}.`;

  showMessage();
  setMessageColor(config.colors.messageDefault);
  setMessageContent(msg);
  resetFields();
}

function showError() {
  showMessage();
  setMessageColor(config.colors.messageError);
  setMessageContent(config.messages.error);
}

function logError(msg) {
  console.error(msg);
}

function setMessageContent(content) {
  document.querySelector('#message p').innerHTML = content;
}

function setMessageColor(colorCode) {
  document.querySelector('#message').style.color = colorCode;
}

function showMessage() {
  document.querySelector('#message').style.display = 'block';
}

function hideMessage() {
  document.querySelector('#message').style.display = 'none';
}

function resetFields() {
  document.getElementById('form-url').value = '';
  document.getElementById('form-alias').value = '';
}