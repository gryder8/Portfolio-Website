<!--src/Components/Footer/Footer.svelte-->

<script>
    export let footerData = {};
    export let header = "";
    const {
        CONTACT_DETAILS
    } = footerData;
    const { HEADING, EMAIL } = CONTACT_DETAILS;
</script>

<!------------------------------------------->
<!----------------MARKUP----------------------->
<!------------------------------------------->
<section class="main-bgcolor light-color" id="footer">
    <img src="images/wave2.png" alt="" class="wave-img" />
    <div class="container">
        <div class="row section-body">
            <div class="col-md-4 footer-box">
                <div class="dark-name">{header}</div>
<!--                <p>{DESCRIPTION}</p>-->
            </div>
            <div class="col-md-4 footer-box">
                <p class="footer-title">{HEADING}</p>
                <a href="mailto:gavin.ryder.dev@icloud.com">
                <p>
                    <i class="fas fa-envelope"></i>
                    {EMAIL}
                </p>
                </a>
            </div>
        </div>
    </div>
</section>
<!------------------------------------------->
<!----------------Style----------------------->
<!------------------------------------------->
<style>
    .footer-title {
        /*color: rgb(122, 150, 171);*/
        font-weight: bold;
        text-transform: uppercase;
    }


    /*
    .round-border {
        border-radius: 20px !important;
    }
    */
    .wave-img {
        width: 100%;
        height: auto;
    }
</style>