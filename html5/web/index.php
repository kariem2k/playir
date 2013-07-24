<html>
    <head>
		<title>Playitor</title>
		<meta name="viewport" content="width=device-width">
    </head>

    <body bgcolor="#000000" class="nomargin body" style="overflow: hidden;">

        <script>
            window.SERVER_ROOT = "../";
            <?php
                if( isset( $_GET['id'] ) )
                {
                    echo 'var CLIENT_ID = "' . $_GET['id'] . '";';
                }
            ?>
        </script>

        <script type="text/javascript" src="jsmin/external.js"></script>
        <script type="text/javascript" src="jsmin/engine.js"></script>
        <script type="text/javascript" src="jsmin/app.js"></script>

        <script>
            window.onload = function()
            {
                new CCEngine();
            };
        </script>

		<table class="nomargin" width="100%" height="100%">
			<tbody><tr><td valign="middle">
                <center>
                    <noscript>
                        <span style="font-size: 18;">
                            Please enable javascript or upgrade to a javascript compatible web browser.<br>
                        </span>
                    </noscript>
				</center>
			</td></tr></tbody>
		</table>

    </body>
</html>