const links = [
    {
        title: "PLC - Sanjay Kumar",
        url: "https://www.linkedin.com/in/sanjay-kumar-6419603a2/"
    },
    {
        title: "PLC - Mohini Bharati",
        url: "https://www.linkedin.com/in/mohini-bharati-00514a2b1/"
    },
    {
        title: "PLC - krushna Patil",
        url: "https://www.linkedin.com/in/krushna-patil-380853215/"
    },
    {
        title: "PLC - Ala Eddine Hammami",
        url: "https://www.linkedin.com/in/ala-eddine-hammami-8481652a6/"
    },
    {
        title: "Embedded - Lekhraj Ravidas",
        url: "https://www.linkedin.com/in/lekhraj-ravidas-7a9260151/"
    },
    {
        title: "Embedded - Himanshu Sharma",
        url: "https://www.linkedin.com/in/himanshus2847/"
    },
    {
        title: "Embedded - KARTHIKEYAN S",
        url: "https://www.linkedin.com/in/karthikeyan-s-920970379/"
    },
    {
        title: "Embedded - Pradeepa S",
        url: "https://www.linkedin.com/in/pradeepasanthakumar18/"
    },
    {
        title: "Embedded - Sibi S",
        url: "https://www.linkedin.com/in/sibi-s-2850b418b/"
    },
    {
        title: "Electrical and Automation",
        url: "https://www.linkedin.com/company/electrical-and-automation/"
    },
    {
        title: "Fuel Loading System",
        url: "https://www.linkedin.com/in/fuelloadingsystem/"
    },
    {
        title: "ASKworx_Official",
        url: "https://www.linkedin.com/company/askworx-in/"
    },
];

const container = document.getElementById("linkContainer");

links.forEach(item => {

    const card = document.createElement("a");

    card.href = item.url;
    card.target = "_blank";
    card.className = "link-card";

    card.innerHTML = `
        <div class="link-title">${item.title}</div>
        <div class="link-url">${item.url}</div>
        <div class="open-text">Open →</div>
    `;

    container.appendChild(card);

});