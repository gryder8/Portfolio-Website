<!--src/Components/Experience/Experience.svelte-->

<script>
    export let projectData = {};
    const {HEADING, PROJECT_LIST, NOTE} = projectData;
</script>

<!------------------------------------------->
<!----------------MARKUP----------------------->
<!------------------------------------------->
<section id="projects" class="section">
    <div class="container text-center">
        <h2 class="title">{HEADING}</h2>
        <div class="row section-body">
            {#each PROJECT_LIST as list}
                <div class="col-md-4 project">
                    <img src={list.URL} alt={list.LABEL} class="project-img"/>
                    <h4>{list.LABEL}</h4>
                    <div class="link-detail">
                        {#if list.APP_STORE_URL !== ""}
                            <a href={list.APP_STORE_URL}>View on App Store</a><br>
                        {/if}
                        <a href={list.PROJECT_URL}>View on GitHub</a>
                    </div>
                    <p>{list.DESCRIPTION}</p>
                </div>
            {/each}
            <div>
                <a class="note note-leading">Note:</a> <a class="note note-trailing"> {NOTE}</a>
            </div>
        </div>

        <a class="btn btn-primary round-border main-bgcolor" href="./downloads/Resume.pdf" download="GavinRyderResume">My
            Resume</a>

    </div>
</section>
<!------------------------------------------->
<!----------------STYLE----------------------->
<!------------------------------------------->
<style>
    .link-detail {
        padding-bottom: 10px;
    }

    .note-leading {
        font-weight: bold;
        color: blue;
    }

    .note-trailing {
        padding-left: 5px;
    }

    .note {
        padding-bottom: 10px;
    }

    .project-img {
        width: 200px;
        height: 200px;
        margin-top: 20px;
        border-radius: 25%;
        overflow: hidden;
    }

    .project-img:hover {
        transform: scale(1.05);
        transition: transform 0.2s;
        box-shadow: 0 0 11px rgba(33,33,33,.2);
    }

    .project h4 {
        padding: 5px;
        margin-top: 25px;
    }

    .title {
        text-transform: uppercase;
    }

    .title::before {
        content: "";
        background: linear-gradient(90deg, #7a96ab 0%, #cacaca 100%);
        height: 5px;
        width: 180px;
        margin-left: auto;
        margin-right: auto;
        display: block;
        transform: translateY(45px);
    }

    section .btn-primary {
        box-shadow: none;
        padding: 8px 25px;
        border: none;
    }
</style>