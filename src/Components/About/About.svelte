<!--src/Components/About/About.svelte-->

<script>
    export let aboutData = {};
    const { HEADING, TITLE, IMAGE_URL, ABOUT_ME_LIST } = aboutData;
</script>
<!------------------------------------------->
<!----------------MARKUP----------------------->
<!------------------------------------------->
<section id="about" class="section grey-bgcolor">
    <div class="container">
        <h2 class="title text-center">{HEADING}</h2>
        <div class="row section-body">
            <div class="col-md-6">
                <h3 class="about-title">{TITLE}</h3>
                <ul>
                    {#each ABOUT_ME_LIST as list}
                        <li>{list}</li>
                    {/each}
                </ul>
            </div>
            <div class="col-sm-6">
                <img src={IMAGE_URL} alt="" class="img-fluid about-img" />
            </div>
        </div>
    </div>
</section>

<!------------------------------------------->
<!----------------STYLE----------------------->
<!------------------------------------------->
<style>
    .about-img {
        padding-top: 40px;
        width: 50%;
        height: auto;
    }
    /*
    .rounded-img-box {
        object-fit: cover;
        width: 400px;
        height: 400px;
        border-radius: 20%;
        overflow: hidden;
    }
    */
    .about-title {
        margin-top: 8%;
        margin-bottom: 20px;
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

    .title {
        text-transform: uppercase;
    }

    section ul li {
        margin: 10px 0;
    }

    section ul {
        padding-left: 23px;
    }
</style>