<!--src/App.svelte-->
<script>
	import Navbar from "./Components/Navbar/Navbar.svelte";
	import Banner from "./Components/Banner/Banner.svelte";
	import Projects from "./Components/Projects/Projects.svelte";
	import About from "./Components/About/About.svelte";
	import Experience from "./Components/Experience/Experience.svelte";
	import Social from "./Components/Social/Social.svelte";
	import Footer from "./Components/Footer/Footer.svelte";
	import DATA from "./Data/data";
</script>

<!-- Navbar -->
<Navbar navlists={DATA.NAVBAR_DATA} header={DATA.HEADER} />
<!-- Banner -->
<Banner bannerData={DATA.BANNER_DATA} } />
<!-- Projects -->
<Projects projectData={DATA.PROJECT_DATA} />
<Experience experienceData={DATA.EXPERIENCE_DATA} />

<!-- About -->
<About aboutData={DATA.ABOUT_DATA} />
<!-- Experience -->

<!-- Social Media -->
<!--<Social socialData={DATA.SOCIAL_DATA} /-->
<!-- Footer -->
<Footer footerData={DATA.FOOTER_DATA} header={DATA.HEADER} />