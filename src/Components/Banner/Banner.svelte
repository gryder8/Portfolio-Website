<!--src/Components/Banner/Banner.svelte-->
<!--TODO: Home img-->
<script>
    import Icon from 'svelte-awesome'
    import githubSquare from 'svelte-awesome/icons/githubSquare';
    import linkedInSquare from 'svelte-awesome/icons/linkedinSquare'
    export let bannerData = {};
    const { HEADING, DESCRIPTION, GITHUB_URL, VISIT_GITHUB, LINKEDIN_URL, VISIT_LINKEDIN } = bannerData;
</script>
<!------------------------------------------->
<!----------------MARKUP----------------------->
<!------------------------------------------->
<section class="main-bgcolor light-color" id="">
    <div class="container">
        <div class="row">
            <div class="col-md-6">
                <h1>{HEADING}</h1>
                <p>{DESCRIPTION}</p>
                <Icon data={githubSquare} scale="1.5"/>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" class="icon-label">
                    {VISIT_GITHUB}
                </a>
                <br>
                <Icon data={linkedInSquare} scale="1.5"/>
                <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" class="icon-label">
                    {VISIT_LINKEDIN}
                </a>
            </div>
            <div class="col-md-6">
                <img src="images/WebsiteBannerImage.png" alt="" class="img-fluid" />
            </div>
        </div>
    </div>
    <img src="images/wave1.png" alt="" class="wave-img" />
</section>
<!------------------------------------------->
<!----------------STYLE----------------------->
<!------------------------------------------->
<style>
    section {
        padding-top: 5%;
    }

    h1 {
        font-size: 36px;
        font-weight: 600;
        margin-top: 100px;
        font-family: -apple-system-title,system-ui;
    }

    section a {
        text-decoration: none;
    }

    .wave-img {
        width: 100%;
        height: auto;
    }

    .icon-label {
        color: var(--light) !important;
        padding-left: 5px;
    }
</style>