{#
Custom head.
#}
<script>
    (function(){
        if('{{ page.password }}'){
            if (prompt('Enter the post password') !== '{{ page.password }}'){
                alert('Incorrect password.');
                history.back();
            }
        }
    })();
</script>
