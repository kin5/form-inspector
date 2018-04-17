chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.event == "fetchRequest") {
        var sfForms = document.querySelectorAll("form");
        var sfFormData = [];

        for(var i=0; i<sfForms.length; i++) {
            var formData = {
                index: i,
                action: sfForms[i].getAttribute("action"),
                method: sfForms[i].getAttribute("method"),
                inputs: []
            };

            var form = sfForms[i];

            var inputs = form.querySelectorAll(["input", "select", "textarea"]);

            for(var j=0; j<inputs.length; j++) {
                if(inputs[j].getAttribute("type") == "submit") {
                    continue;
                }

                var inputData = {
                    tag: inputs[j].tagName.toLowerCase(),
                    type: inputs[j].getAttribute("type"),
                    name: inputs[j].getAttribute("name"),
                    id: inputs[j].getAttribute("id"),
                    class: inputs[j].classList,
                    value: inputs[j].value,
                    label: null
                };

                if(inputData.tag == "select") {
                    inputData.options = [];

                    var options = inputs[j].querySelectorAll("option");

                    for(var k=0; k<options.length; k++) {
                        var optionData = {
                            value: options[k].value,
                            text: options[k].innerHTML
                        };

                        inputData.options.push(optionData);
                    }
                }
                else if(inputData.type == "checkbox" || inputData.type == "radio") {
                    inputData.checked = inputs[j].checked;
                }

                var label = form.querySelector("label[for='" + (inputData.id || inputData.name) + "']");

                if(label) {
                    inputData.label = label.innerText;
                }
                else {
                    if(inputs[j].getAttribute("placeholder")) {
                        inputData.label = inputs[j].getAttribute("placeholder");
                    }
                    else if(inputs[j].getAttribute("aria-label")) {
                        inputData.label = inputs[j].getAttribute("aria-label");
                    }
                    else if(inputData.name || inputData.id) {
                        inputData.label = inputData.name || inputData.id;
                    }
                    else {
                        inputData.label = inputData.type + ("" + j);
                    }
                }

                formData.inputs.push(inputData);
            }

            sfFormData.push(formData);
        }

        sendResponse({ event: "fetchResponse", formData: sfFormData });
    }
    else if(request.event == "updateRequest") {
        var sfForms = document.querySelectorAll("form");

        // locat form via index
        var form = sfForms[request.data.formIndex];

        // locat input via data
        var inputSelector = request.data.tag;

        if(request.data.id) {
            inputSelector += "#" + request.data.id;
        }
        else if(request.data.name) {
            inputSelector += "[name='" + request.data.name + "']";
        }

        var input  = form.querySelector(inputSelector);

        if(input) {
            if(request.data.tag == "textarea") {
                input.innerHTML = request.data.value;
            }
            else if(request.data.type == "checkbox" || request.data.type == "radio") {
                input.checked = request.data.checked;
            }
            else {
                input.value = request.data.value;
            }
        }

        // change live input with new data
        console.log(input.checked);
        sendResponse({ event: "updateResponse" });
    }
    else if(request.event == "submitRequest") {
        var sfForms = document.querySelectorAll("form");

        var form = sfForms[request.data.formIndex];

        var submitConflicts = form.querySelectorAll(["#submit", "[name='submit']"]);

        for(var i=0; i<submitConflicts.length; i++) {
            submitConflicts[i].setAttribute("name", submitConflicts[i].getAttribute("name") + "-" + i);
            submitConflicts[i].setAttribute("id", submitConflicts[i].getAttribute("id") + "-" + i);
        }

        form.submit();
        console.log(form);
        sendResponse({ event: "submitResponse" });
    }
    else if(request.event == "highlightForm") {
        var forms = document.querySelectorAll("form");

        for(var i=0; i<forms.length; i++) {
            forms[i].style.outlineStyle = "";
            forms[i].style.outlineWidth = "";
            forms[i].style.outlineColor = "";
        }

        if(request.data.formIndex !== null) {
            var form = forms[request.data.formIndex];

            form.style.outlineStyle = "solid";
            form.style.outlineWidth = "3px";
            form.style.outlineColor = "rgba(255, 0, 0, 0.75)";
            form.style.outlineOffset = "5px";

            if(request.data.scrollTo) {
                window.scrollTo({
                    top: form.offsetTop - 20,
                    behavior: "smooth"
                });
            }
        }
    }
});