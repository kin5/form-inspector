var globalOptions = {
    testMode: false,
    testOverride: false,
    testIgnoreHidden: true,
    testText: "",
    testPhone: "",
    testEmail: "",
    testZip: "",
    testSelect: 0,
    testHoneypots: "",
    formFilter: ""
};

var generateForm = function(formData, formLanding) {
    var formTitle = document.createElement("h2");
    formTitle.className = "form-title";
    formTitle.innerHTML = "Form " + (formData.index + 1);
    formLanding.appendChild(formTitle);

    var formActionTitle = document.createElement("p");
    formActionTitle.className = "form-action-title";
    formActionTitle.innerHTML = (formData.method ? formData.method.toUpperCase() + " to " : "") + (formData.action || "");
    formLanding.appendChild(formActionTitle);

    var honeyPots = globalOptions.testHoneypots.split(",");
    // Add common honey pots such as recaptcha by default
    honeyPots.push("g-recaptcha-response");

    formData.inputs.filter((input) => {
        return (honeyPots.indexOf(input.id) == -1) && (honeyPots.indexOf(input.name) == -1);
    }).map(function(input, inputIndex) {
        var elementType = input.type;
        var elementTag = input.tag;

        if(elementType == "hidden") {
            elementType = "text";
        }

        if(elementTag == "textarea") {
            elementTag = "input";
            elementType = "text";
        }

        var element = document.createElement(elementTag);
        element.type = elementType;
        element.value = input.value;
        element.id = formData.index + "-" + inputIndex;
        element.setAttribute("data-id", input.id);
        element.setAttribute("name", input.name);
        element.setAttribute("data-class", input.class);

        if(input.tag == "select") {
            input.options.map(function(optionData) {
                var option = document.createElement("option");
                option.value = optionData.value;
                option.innerHTML = optionData.text;

                element.appendChild(option);
            });
        }
        else if(input.type == "checkbox" || input.type == "radio") {
            element.checked = input.checked;
        }

        var label = document.createElement("label");
        label.innerHTML = input.label;
        label.for = (input.id || input.name);

        var br = document.createElement("br");

        formLanding.appendChild(label);
        formLanding.appendChild(element);
        formLanding.appendChild(br);

        element.addEventListener("keyup", function() {
            var updateRequest = buildUpdateRequest(element, input, formData);

            sendUpdateRequest(updateRequest);
        });

        element.addEventListener("change", function() {
            var updateRequest = buildUpdateRequest(element, input, formData);

            sendUpdateRequest(updateRequest);
        });

        if(globalOptions.testMode) {
            if((input.type == "hidden" && globalOptions.testIgnoreHidden) || input.type == "file" ) {
                return;
            }
            else if(!element.value || globalOptions.testOverride) {
                if(input.type == "email" || input.label.toLowerCase().indexOf("email") > -1 || input.label.toLowerCase().indexOf("e-mail") > -1) {
                    element.value = globalOptions.testEmail || "";
                }
                else if(input.type == "phone" || input.label.toLowerCase().indexOf("phone") > -1) {
                    element.value = globalOptions.testPhone || "";
                }
                else if(input.label.toLowerCase().indexOf("zip") > -1) {
                    element.value = globalOptions.testZip || "";
                }
                else if(input.tag == "select") {
                    try {
                        element.value = input.options[globalOptions.testSelect].value;
                    }
                    catch(error) {
                        element.value = input.options[0].value;
                    }
                }
                else {
                    element.value = globalOptions.testText;
                }

                var updateRequest = buildUpdateRequest(element, input, formData);

                sendUpdateRequest(updateRequest);
            }
        }
    });

    var formSubmit = document.createElement("button");
    formSubmit.id = "form-submit-" + formData.index;
    formSubmit.setAttribute("data-form-index", formData.index);
    formSubmit.className = "btn btn-form-submit";
    formSubmit.innerHTML = "Submit";

    formLanding.appendChild(formSubmit);

    formSubmit.addEventListener("click", function() {
        sendSubmitRequest({ formIndex: formData.index });
    });
};

var buildUpdateRequest = function(element, inputData, formData) {
    var updateRequest = { 
        tag: inputData.tag,
        type: inputData.type,
        id: inputData.id,
        name: inputData.name,
        class: inputData.class,
        value: element.value,
        formIndex: formData.index
    };

    if(inputData.type == "checkbox" || inputData.type == "radio") {
        updateRequest.checked = element.checked;
    }

    return updateRequest;
}

var sendUpdateRequest = function(event) {
    console.log(event);
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { event: "updateRequest", data: event }, function(response) {
            console.log(response);
        });
    });
};

var sendSubmitRequest = function(event) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { event: "submitRequest", data: event }, function(response) {
            console.log(response);
        });
    });
};

var sendFetchRequest = function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { event: "fetchRequest" }, function(response) {
            console.log(response);

            var formLanding = document.getElementById("inspect-content");

            formLanding.innerHTML = "";

            if(!response || !response.formData.length) {
                formLanding.innerHTML = "<p>We aren't detecting any forms on this page</p>";
            }
            else {
                response.formData.map(function(form) {
                    generateForm(form, formLanding);
                });
            }
        });
    });
}

var fetchOptions = function() {
    chrome.storage.local.get(["testMode", "testText", "testPhone", "testEmail", "testZip", "testSelect", "testOverride", "testIgnoreHidden", "testHoneypots"], function(items) {
        console.log(items);
        globalOptions = Object.assign(globalOptions, items);

        for(key in globalOptions) {
            var optionElement = document.querySelector("[data-model='" + key + "']");
            if(optionElement) {
                if(optionElement.type == "checkbox") {
                    optionElement.checked = globalOptions[key];
                }
                else {
                    optionElement.value = globalOptions[key];
                }
            }
        }
    });
};

document.addEventListener("DOMContentLoaded", function() {
    sendFetchRequest();

    fetchOptions();

    /*
    *   Popup DOM event listeners
    */

    document.getElementById("toggle-test-options").addEventListener("click", function() {
        var testContent = document.getElementById("test-content");
        if(testContent.style.display == "none") {
            testContent.style.display = "block";
        }
        else {
            testContent.style.display = "none";
        }
    });

    document.getElementById("toggle-test-mode").addEventListener("click", function(e) {
        chrome.storage.local.set({ testMode: e.target.checked }, function() {
            fetchOptions();
            sendFetchRequest();
        });
    });

    document.getElementById("test-options-submit").addEventListener("click", function() {
        var testText = document.getElementById("test-text").value;
        var testSelect = document.getElementById("test-select").value;
        var testEmail = document.getElementById("test-email").value;
        var testPhone = document.getElementById("test-phone").value;
        var testZip = document.getElementById("test-zip").value;
        var testOverride = document.getElementById("test-override").checked;
        var testIgnoreHidden = document.getElementById("test-hidden").checked;
        var testHoneypots = document.getElementById("test-honeypots").value;

        var optionData = {
            "testText": testText,
            "testSelect": testSelect,
            "testPhone": testPhone,
            "testEmail": testEmail,
            "testZip": testZip,
            "testOverride": testOverride,
            "testIgnoreHidden": testIgnoreHidden,
            "testHoneypots": testHoneypots
        };

        chrome.storage.local.set(optionData, function() {
            console.log("> Options saved");
            fetchOptions();
        });
    });
});