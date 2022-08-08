<!--src/Components/Testimonials/Testimonials.svelte-->

<script>
    export let experienceData = {};
    const { HEADING, EXPERIENCE_LIST } = experienceData;
</script>
<!------------------------------------------->
<!----------------MARKUP----------------------->
<!------------------------------------------->

<section id="testimonials" class="section">
    <div class="container">
        <h2 class="title text-center">{HEADING}</h2>
        <div class="row offset-1 section-body">
            {#each EXPERIENCE_LIST as list}
                <div class="col-md-5 experience">
                    <p>{list.DESCRIPTION}</p>
                    <img src={list.IMAGE_URL} alt="" />
                    <p class="experience-details">
                        <b>{list.NAME}</b>
                        <br />
                        {list.DESIGNATION}
                    </p>
                </div>
            {/each}
        </div>
    </div>
</section>
<!------------------------------------------->
<!----------------STYLE----------------------->
<!------------------------------------------->
<style>
    .experience {
        border-left: 4px solid #0072ff80;
        margin-top: 10px;
        margin-bottom: 10px;
    }

    .experience img {
        height: 60px;
        width: 60px;
        border-radius: 50%;
        margin: 0 10px;
    }

    .title::before {
        content: "";
        background: linear-gradient(90deg, #0072ff 0%, #00d4ff 100%);
        height: 5px;
        width: 300px;
        margin-left: auto;
        margin-right: auto;
        display: block;
        transform: translateY(45px);
    }

    .title {
        text-transform: uppercase;
    }

    .experience-details {
        display: inline-block;
        font-size: 12px;
    }
</style>