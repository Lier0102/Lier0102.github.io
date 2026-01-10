{# Duoshuo hot articles #}
{% if (theme.duoshuo_hotartical and page.title) %}
  <p>Hot articles</p>
  <div class="ds-top-threads" data-range="weekly" data-num-items="4"></div>
{% endif %}
