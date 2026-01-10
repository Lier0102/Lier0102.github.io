{% if theme.mob_share.enable %}
<script type="text/javascript">    // Close the WeChat QR dialog when clicking the background
    $('body').delegate('.-mob-share-weixin-qrcode-bg','click', function(){
         $(".-mob-share-weixin-qrcode-close").trigger("click");
    }); 
</script>
{% endif %}

