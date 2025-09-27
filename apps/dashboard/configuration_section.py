import panel as pn

from infrastructure.configuration.configuration import Configuration

pn.extension("tabulator")


def configuration_section(configuration: Configuration):

    def form_section():
        """
        Create a form section with two text fields and a save button.

        :return: A Panel layout containing the form.
        """
        text_field_1 = pn.widgets.TextInput(
            name="Repository",
            placeholder="",
            value=configuration.github_repository,
            disabled=True,
        )
        text_field_2 = pn.widgets.TextAreaInput(
            name="Data stored at",
            placeholder="",
            value=configuration.store_data,
            rows=6,
            auto_grow=True,
            disabled=True,
            max_rows=10,
        )
        save_button = pn.widgets.Button(name="Save", button_type="primary")

        def save_action(event):
            # Logic to save the input values
            field_1_value = text_field_1.value
            field_2_value = text_field_2.value
            print(f"Saved values: Field 1 = {field_1_value}, Field 2 = {field_2_value}")

        save_button.on_click(save_action)

        return pn.Column(
            "### Input Form",
            text_field_1,
            text_field_2,
            save_button,
        )

    return pn.Column(
        "## Configuration section",
        pn.Row(form_section()),
    )
